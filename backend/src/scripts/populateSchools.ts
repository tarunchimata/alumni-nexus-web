#!/usr/bin/env node

/**
 * School Data Population Script
 * Populates the database with comprehensive school data for India
 */

import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface SchoolData {
  institutionId: string;
  schoolName: string;
  villageName?: string;
  districtName?: string;
  stateName: string;
  udiseCode?: string;
  schoolType?: string;
  schoolCategory?: string;
  managementType?: string;
  contactNumber?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  establishmentYear?: number;
  recognitionStatus?: string;
  boardAffiliation?: string;
}

const SAMPLE_SCHOOLS: SchoolData[] = [
  {
    institutionId: 'DPS_MUM_001',
    schoolName: 'Delhi Public School Mumbai',
    villageName: 'Borivali',
    districtName: 'Mumbai Suburban',
    stateName: 'Maharashtra',
    udiseCode: '12345678901',
    schoolType: 'Secondary School',
    schoolCategory: 'Co-educational',
    managementType: 'Private',
    contactNumber: '+91-22-12345678',
    pincode: '400103',
    latitude: 19.2306,
    longitude: 72.8583,
    establishmentYear: 1985,
    recognitionStatus: 'Recognized',
    boardAffiliation: 'CBSE'
  },
  {
    institutionId: 'KV_DEL_001',
    schoolName: 'Kendriya Vidyalaya Sector 24 Rohini',
    villageName: 'Rohini',
    districtName: 'North West Delhi',
    stateName: 'Delhi',
    udiseCode: '12345678902',
    schoolType: 'Higher Secondary School',
    schoolCategory: 'Co-educational',
    managementType: 'Government',
    contactNumber: '+91-11-12345678',
    pincode: '110085',
    latitude: 28.7041,
    longitude: 77.1025,
    establishmentYear: 1963,
    recognitionStatus: 'Recognized',
    boardAffiliation: 'CBSE'
  },
  {
    institutionId: 'DAV_CHD_001',
    schoolName: 'DAV Public School Chandigarh',
    villageName: 'Sector 8',
    districtName: 'Chandigarh',
    stateName: 'Chandigarh',
    udiseCode: '12345678903',
    schoolType: 'Higher Secondary School',
    schoolCategory: 'Co-educational',
    managementType: 'Private',
    contactNumber: '+91-172-12345678',
    pincode: '160008',
    latitude: 30.7333,
    longitude: 76.7794,
    establishmentYear: 1971,
    recognitionStatus: 'Recognized',
    boardAffiliation: 'CBSE'
  },
  {
    institutionId: 'RYAN_BNG_001',
    schoolName: 'Ryan International School Bangalore',
    villageName: 'Kundalahalli',
    districtName: 'Bangalore Urban',
    stateName: 'Karnataka',
    udiseCode: '12345678904',
    schoolType: 'Higher Secondary School',
    schoolCategory: 'Co-educational',
    managementType: 'Private',
    contactNumber: '+91-80-12345678',
    pincode: '560037',
    latitude: 12.9716,
    longitude: 77.5946,
    establishmentYear: 1976,
    recognitionStatus: 'Recognized',
    boardAffiliation: 'CBSE'
  },
  {
    institutionId: 'SRCC_DEL_001',
    schoolName: 'Shri Ram College of Commerce',
    villageName: 'Maurice Nagar',
    districtName: 'North Delhi',
    stateName: 'Delhi',
    udiseCode: '12345678905',
    schoolType: 'College',
    schoolCategory: 'Co-educational',
    managementType: 'Private',
    contactNumber: '+91-11-12345679',
    pincode: '110007',
    latitude: 28.6850,
    longitude: 77.2072,
    establishmentYear: 1926,
    recognitionStatus: 'Recognized',
    boardAffiliation: 'Delhi University'
  }
];

// Generate more schools across different states
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const SCHOOL_TYPES = ['Primary School', 'Upper Primary School', 'Secondary School', 'Higher Secondary School', 'College', 'University'];
const MANAGEMENT_TYPES = ['Government', 'Private', 'Aided', 'Unaided'];
const SCHOOL_CATEGORIES = ['Co-educational', 'Boys Only', 'Girls Only'];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];

function generateSchoolData(count: number): SchoolData[] {
  const schools: SchoolData[] = [...SAMPLE_SCHOOLS];
  
  for (let i = 0; i < count; i++) {
    const state = STATES[Math.floor(Math.random() * STATES.length)];
    const schoolType = SCHOOL_TYPES[Math.floor(Math.random() * SCHOOL_TYPES.length)];
    const managementType = MANAGEMENT_TYPES[Math.floor(Math.random() * MANAGEMENT_TYPES.length)];
    const category = SCHOOL_CATEGORIES[Math.floor(Math.random() * SCHOOL_CATEGORIES.length)];
    const board = BOARDS[Math.floor(Math.random() * BOARDS.length)];
    
    const schoolNames = [
      'St. Mary\'s School', 'Mount Carmel School', 'Holy Cross School',
      'Don Bosco School', 'Kendriya Vidyalaya', 'Jawahar Navodaya Vidyalaya',
      'Delhi Public School', 'Ryan International School', 'DAV Public School',
      'Modern School', 'Bharatiya Vidya Bhavan', 'Bal Bharati Public School'
    ];
    
    const schoolName = schoolNames[Math.floor(Math.random() * schoolNames.length)];
    const institutionId = `${schoolName.replace(/[^A-Z]/g, '').substring(0, 6)}_${state.replace(/[^A-Z]/g, '').substring(0, 3)}_${String(i + 1).padStart(3, '0')}`;
    
    schools.push({
      institutionId,
      schoolName: `${schoolName} ${state}`,
      villageName: `Village ${i + 1}`,
      districtName: `District ${Math.floor(i / 10) + 1}`,
      stateName: state,
      udiseCode: `${12345678900 + i + 6}`,
      schoolType,
      schoolCategory: category,
      managementType,
      contactNumber: `+91-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 900000) + 100000}`,
      pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
      latitude: Math.random() * (35 - 8) + 8, // India's latitude range
      longitude: Math.random() * (97 - 68) + 68, // India's longitude range
      establishmentYear: Math.floor(Math.random() * (2020 - 1950)) + 1950,
      recognitionStatus: Math.random() > 0.1 ? 'Recognized' : 'Under Process',
      boardAffiliation: board
    });
  }
  
  return schools;
}

async function loadFromCSV(filePath: string): Promise<SchoolData[]> {
  return new Promise((resolve, reject) => {
    const results: SchoolData[] = [];
    
    if (!fs.existsSync(filePath)) {
      logger.warn(`CSV file not found: ${filePath}. Using generated data.`);
      resolve([]);
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Map CSV columns to our schema
        const school: SchoolData = {
          institutionId: data.institution_id || data.institutionId || `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          schoolName: data.school_name || data.schoolName || '',
          villageName: data.village_name || data.villageName || data.village || '',
          districtName: data.district_name || data.districtName || data.district || '',
          stateName: data.state_name || data.stateName || data.state || '',
          udiseCode: data.udise_code || data.udiseCode || data.udise || '',
          schoolType: data.school_type || data.schoolType || 'Secondary School',
          schoolCategory: data.school_category || data.schoolCategory || 'Co-educational',
          managementType: data.management_type || data.managementType || 'Private',
          contactNumber: data.contact_number || data.contactNumber || data.phone || '',
          pincode: data.pincode || data.pin || '',
          latitude: data.latitude ? parseFloat(data.latitude) : undefined,
          longitude: data.longitude ? parseFloat(data.longitude) : undefined,
          establishmentYear: data.establishment_year ? parseInt(data.establishment_year) : undefined,
          recognitionStatus: data.recognition_status || data.recognitionStatus || 'Recognized',
          boardAffiliation: data.board_affiliation || data.boardAffiliation || 'State Board'
        };
        
        if (school.schoolName && school.stateName) {
          results.push(school);
        }
      })
      .on('end', () => {
        logger.info(`Loaded ${results.length} schools from CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
}

async function populateSchools(count: number = 5000, csvPath?: string) {
  try {
    logger.info('Starting school data population...');
    
    let schoolsData: SchoolData[] = [];
    
    // Try to load from CSV first
    if (csvPath) {
      schoolsData = await loadFromCSV(csvPath);
    }
    
    // If no CSV data or insufficient data, generate more
    if (schoolsData.length < count) {
      const needed = count - schoolsData.length;
      logger.info(`Generating ${needed} additional schools...`);
      const generated = generateSchoolData(needed);
      schoolsData = [...schoolsData, ...generated];
    }
    
    logger.info(`Preparing to insert ${schoolsData.length} schools...`);
    
    // Clear existing data if needed
    const existingCount = await prisma.school.count();
    if (existingCount > 0) {
      logger.warn(`Found ${existingCount} existing schools. This will add to them.`);
    }
    
    // Batch insert for better performance
    const batchSize = 100;
    let inserted = 0;
    let skipped = 0;
    
    for (let i = 0; i < schoolsData.length; i += batchSize) {
      const batch = schoolsData.slice(i, i + batchSize);
      
      try {
        // Use createMany with skipDuplicates to handle existing institutions
        const result = await prisma.school.createMany({
          data: batch.map(school => ({
            institutionId: school.institutionId,
            schoolName: school.schoolName,
            villageName: school.villageName,
            districtName: school.districtName,
            stateName: school.stateName,
            udiseCode: school.udiseCode,
            schoolType: school.schoolType,
            schoolCategory: school.schoolCategory,
            managementType: school.managementType,
            contactNumber: school.contactNumber,
            pincode: school.pincode,
            latitude: school.latitude,
            longitude: school.longitude,
            establishmentYear: school.establishmentYear,
            recognitionStatus: school.recognitionStatus,
            boardAffiliation: school.boardAffiliation,
            isActive: true,
            status: 'Active'
          })),
          skipDuplicates: true
        });
        
        inserted += result.count;
        logger.info(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.count} schools`);
      } catch (error: any) {
        logger.error(`Failed to insert batch ${Math.floor(i / batchSize) + 1}:`, error);
        skipped += batch.length;
      }
    }
    
    // Create indexes for better search performance
    logger.info('Creating search indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_schools_search_optimized ON schools USING gin(to_tsvector('english', school_name || ' ' || COALESCE(village_name, '') || ' ' || COALESCE(district_name, '') || ' ' || state_name))`;
    
    // Update statistics
    await prisma.$executeRaw`ANALYZE schools`;
    
    const finalCount = await prisma.school.count();
    
    logger.info('School population completed!');
    logger.info(`- Total schools in database: ${finalCount}`);
    logger.info(`- Successfully inserted: ${inserted}`);
    logger.info(`- Skipped (duplicates/errors): ${skipped}`);
    
    // Sample some results
    const sampleSchools = await prisma.school.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    logger.info('Sample schools created:');
    sampleSchools.forEach((school, index) => {
      logger.info(`${index + 1}. ${school.schoolName} - ${school.stateName} (ID: ${school.institutionId})`);
    });
    
    return {
      totalInDatabase: finalCount,
      inserted,
      skipped
    };
    
  } catch (error) {
    logger.error('School population failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 5000;
  const csvPath = args[1];
  
  logger.info(`Starting school population with count: ${count}`);
  if (csvPath) {
    logger.info(`Using CSV file: ${csvPath}`);
  }
  
  populateSchools(count, csvPath)
    .then((result) => {
      logger.info('Population completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Population failed:', error);
      process.exit(1);
    });
}

export { populateSchools, generateSchoolData, loadFromCSV };