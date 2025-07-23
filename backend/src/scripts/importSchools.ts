
/**
 * School CSV Import Script for My School Buddies
 * Imports school data from CSV into the schools table with proper institution_id generation
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// State code mapping for institution_id generation
const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CT',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OR',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TG',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
  'Delhi': 'DL',
  'Puducherry': 'PY',
  'Chandigarh': 'CH',
  'Dadra and Nagar Haveli': 'DN',
  'Daman and Diu': 'DD',
  'Jammu and Kashmir': 'JK',
  'Ladakh': 'LA',
  'Lakshadweep': 'LD',
  'Andaman and Nicobar Islands': 'AN'
};

// Generic CSV row interface - will be adapted based on actual CSV structure
interface CSVRow {
  [key: string]: string;
}

interface SchoolData {
  institutionId: string;
  schoolName: string;
  udiseSchoolCode?: string;
  schoolCategory?: string;
  schoolType?: string;
  management?: string;
  yearOfEstablishment?: string;
  status?: string;
  locationType?: string;
  classFrom?: string;
  classTo?: string;
  affBoardSec?: string;
  affBoardHSec?: string;
  stateName: string;
  districtName?: string;
  subDistrictName?: string;
  villageName?: string;
  pincode?: string;
}

// Generate institution ID: INC-IN-<state_code>-<5_digit_number>
async function generateInstitutionId(stateName: string): Promise<string> {
  const stateCode = STATE_CODES[stateName.trim()] || 'XX';
  
  // Find the highest existing number for this state
  const existingSchools = await prisma.school.findMany({
    where: {
      institutionId: {
        startsWith: `INC-IN-${stateCode}-`
      }
    },
    select: { institutionId: true },
    orderBy: { institutionId: 'desc' }
  });

  let nextNumber = 1;
  if (existingSchools.length > 0) {
    const lastId = existingSchools[0].institutionId;
    const numberPart = lastId.split('-').pop();
    if (numberPart) {
      nextNumber = parseInt(numberPart) + 1;
    }
  }

  return `INC-IN-${stateCode}-${nextNumber.toString().padStart(5, '0')}`;
}

// Clean and standardize data - flexible column mapping
function cleanData(row: CSVRow): SchoolData {
  // Map common column variations to our standard fields
  const getField = (possibleNames: string[]): string => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== '') {
        return row[name].trim();
      }
    }
    return '';
  };

  const schoolName = getField([
    'School Name', 'school_name', 'SchoolName', 'SCHOOL_NAME',
    'School', 'school', 'Name', 'name'
  ]);

  const stateName = getField([
    'State Name', 'state_name', 'StateName', 'STATE_NAME',
    'State', 'state', 'STATE'
  ]);

  const districtName = getField([
    'District', 'district', 'DISTRICT', 'District Name', 'district_name'
  ]);

  const udiseCode = getField([
    'UDISE Code', 'udise_code', 'UDISE_CODE', 'UdiseCode', 'UDISE'
  ]);

  const schoolCategory = getField([
    'School Category', 'school_category', 'SchoolCategory', 'Category', 'category'
  ]);

  const schoolType = getField([
    'School Type', 'school_type', 'SchoolType', 'Type', 'type'
  ]);

  const management = getField([
    'School Management', 'school_management', 'Management', 'management'
  ]);

  const pincode = getField([
    'Pincode', 'pincode', 'PIN', 'pin', 'Pin Code', 'pin_code'
  ]);

  return {
    institutionId: '', // Will be generated
    schoolName,
    udiseSchoolCode: udiseCode || undefined,
    schoolCategory: schoolCategory || undefined,
    schoolType: schoolType || undefined,
    management: management || undefined,
    yearOfEstablishment: getField(['Year of Establishment', 'year_of_establishment', 'Year', 'year']) || undefined,
    status: getField(['School Status', 'status', 'Status']) || undefined,
    locationType: getField(['School Location Type', 'location_type', 'Location']) || undefined,
    classFrom: getField(['Class From', 'class_from', 'ClassFrom']) || undefined,
    classTo: getField(['Class To', 'class_to', 'ClassTo']) || undefined,
    affBoardSec: getField(['Affiliated Board Sec.', 'affiliated_board_sec', 'BoardSec']) || undefined,
    affBoardHSec: getField(['Affiliated Board H. Sec.', 'affiliated_board_hsec', 'BoardHSec']) || undefined,
    stateName,
    districtName: districtName || undefined,
    subDistrictName: getField(['Sub District', 'sub_district', 'SubDistrict']) || undefined,
    villageName: getField(['Village', 'village', 'Village Name', 'village_name']) || undefined,
    pincode: pincode?.substring(0, 6) || undefined, // Trim to 6 digits
  };
}

async function importSchools(csvFilePath: string) {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  logger.info('Starting school import from CSV...');
  
  const results: CSVRow[] = [];
  const errors: Array<{ row: number; error: string; data?: any }> = [];
  let successCount = 0;
  let rowCount = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CSVRow) => {
        results.push(data);
      })
      .on('end', async () => {
        logger.info(`Processing ${results.length} rows from CSV...`);

        // Log first few rows to understand CSV structure
        if (results.length > 0) {
          logger.info('CSV columns detected:', Object.keys(results[0]));
          logger.info('First row sample:', results[0]);
        }

        for (const row of results) {
          rowCount++;
          try {
            const schoolData = cleanData(row);
            
            // Validate required fields
            if (!schoolData.schoolName || !schoolData.stateName) {
              errors.push({
                row: rowCount,
                error: 'Missing required fields: schoolName or stateName',
                data: { schoolName: schoolData.schoolName, stateName: schoolData.stateName }
              });
              continue;
            }

            // Generate institution ID
            schoolData.institutionId = await generateInstitutionId(schoolData.stateName);

            // Check for duplicate UDISE codes
            if (schoolData.udiseSchoolCode) {
              const existing = await prisma.school.findFirst({
                where: { udiseSchoolCode: schoolData.udiseSchoolCode }
              });
              if (existing) {
                errors.push({
                  row: rowCount,
                  error: `Duplicate UDISE code: ${schoolData.udiseSchoolCode}`,
                  data: schoolData
                });
                continue;
              }
            }

            // Create school record with computed legacy fields
            await prisma.school.create({
              data: {
                ...schoolData,
                // Computed legacy fields
                name: schoolData.schoolName,
                udiseCode: schoolData.udiseSchoolCode,
                schoolTypeLegacy: schoolData.schoolCategory?.includes('Primary') ? 'Primary' : 
                                 schoolData.schoolCategory?.includes('Secondary') && !schoolData.schoolCategory?.includes('Higher') ? 'Secondary' :
                                 schoolData.schoolCategory?.includes('Higher Secondary') ? 'Higher Secondary' : 'Primary',
                managementType: schoolData.management?.includes('Government') || schoolData.management?.includes('State') ? 'Government' : 'Private',
                address: [schoolData.villageName, schoolData.subDistrictName, schoolData.districtName, schoolData.stateName, schoolData.pincode]
                          .filter(Boolean).join(', ')
              }
            });

            successCount++;
            
            if (successCount % 100 === 0) {
              logger.info(`Processed ${successCount} schools...`);
            }

          } catch (error: any) {
            errors.push({
              row: rowCount,
              error: error.message,
              data: row
            });
          }
        }

        logger.info(`Import completed: ${successCount} schools created, ${errors.length} errors`);
        
        if (errors.length > 0) {
          logger.warn('Import errors:', errors.slice(0, 10)); // Log first 10 errors
          fs.writeFileSync('import-errors.json', JSON.stringify(errors, null, 2));
          logger.info('Full error details saved to import-errors.json');
        }

        resolve();
      })
      .on('error', (error) => {
        logger.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Main execution
async function main() {
  try {
    const csvPath = process.argv[2];
    if (!csvPath) {
      console.error('Usage: npm run import-schools <path-to-csv-file>');
      process.exit(1);
    }

    await importSchools(csvPath);
    logger.info('School import completed successfully');
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { importSchools };
