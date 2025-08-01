#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import inquirer from 'inquirer';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
//import fs from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { FakerHelpers } from '../utils/faker-helpers';

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

interface UserGenerationConfig {
  roles: UserRole[];
  userCounts: Record<UserRole, number>;
  schoolAssignment: 'random' | 'specific' | 'multi';
  specificSchoolId?: string;
  outputPath: string;
  generateSeparateFiles: boolean;
  directInsert: boolean;
  defaultPassword: string;
  previewMode: boolean;
}

interface GeneratedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolUdiseCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  admissionYear?: string;
  graduationYear?: string;
}

interface SchoolInfo {
  id: number;
  institutionId: string;
  schoolName: string;
  udiseSchoolCode: string;
  stateName: string;
  districtName: string;
}

// ASCII Art Banner
const showBanner = () => {
  console.clear();
  console.log(chalk.cyan(`
  ███╗   ███╗██╗   ██╗    ███████╗ ██████╗██╗  ██╗ ██████╗  ██████╗ ██╗     
  ████╗ ████║╚██╗ ██╔╝    ██╔════╝██╔════╝██║  ██║██╔═══██╗██╔═══██╗██║     
  ██╔████╔██║ ╚████╔╝     ███████╗██║     ███████║██║   ██║██║   ██║██║     
  ██║╚██╔╝██║  ╚██╔╝      ╚════██║██║     ██╔══██║██║   ██║██║   ██║██║     
  ██║ ╚═╝ ██║   ██║       ███████║╚██████╗██║  ██║╚██████╔╝╚██████╔╝███████╗
  ╚═╝     ╚═╝   ╚═╝       ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
                                                                              
  ██████╗ ██╗   ██╗██████╗ ██████╗ ██╗███████╗███████╗                      
  ██╔══██╗██║   ██║██╔══██╗██╔══██╗██║██╔════╝██╔════╝                      
  ██████╔╝██║   ██║██║  ██║██║  ██║██║█████╗  ███████╗                      
  ██╔══██╗██║   ██║██║  ██║██║  ██║██║██╔══╝  ╚════██║                      
  ██████╔╝╚██████╔╝██████╔╝██████╔╝██║███████╗███████║                      
  ╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝╚══════╝╚══════╝                      
                                                                              
          ${chalk.yellow('🎭 FAKE USER GENERATOR')} ${chalk.gray('v1.0')}
          ${chalk.blue('Generate realistic test data for your platform')}
  `));
};

// School cache for efficient lookup
let schoolCache: SchoolInfo[] = [];

const loadSchoolCache = async (): Promise<void> => {
  console.log(chalk.blue('📚 Loading schools from database...'));
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        institutionId: true,
        schoolName: true,
        udiseSchoolCode: true,
        stateName: true,
        districtName: true
      }
    });

    schoolCache = schools.map(school => ({
      id: school.id,
      institutionId: school.institutionId,
      schoolName: school.schoolName,
      udiseSchoolCode: school.udiseSchoolCode || 'UNKNOWN',
      stateName: school.stateName || 'Unknown',
      districtName: school.districtName || 'Unknown'
    }));

    console.log(chalk.green(`✅ Loaded ${schoolCache.length} schools`));
  } catch (error) {
    logger.error('Failed to load schools:', error);
    throw new Error('Could not connect to database to load schools');
  }
};

const generateUser = async (role: UserRole, schoolUdiseCode: string): Promise<GeneratedUser> => {
  const { firstName, lastName } = FakerHelpers.generateIndianName();
  const dateOfBirth = FakerHelpers.generateDateOfBirth(role);
  const academicYears = FakerHelpers.generateAcademicYears(role, dateOfBirth);
  
  // Generate unique email using the helper
  const email = FakerHelpers.generateEmailAddress(firstName, lastName);

  return {
    email,
    firstName,
    lastName,
    role,
    schoolUdiseCode,
    phoneNumber: FakerHelpers.generateIndianPhoneNumber(),
    dateOfBirth: dateOfBirth.toISOString().split('T')[0], // YYYY-MM-DD format
    admissionYear: academicYears.admissionYear || '',
    graduationYear: academicYears.graduationYear || ''
  };
};

const generateUsers = async (config: UserGenerationConfig): Promise<Map<UserRole, GeneratedUser[]>> => {
  const usersByRole = new Map<UserRole, GeneratedUser[]>();
  
  // Calculate total users to generate
  const totalUsers = Object.values(config.userCounts).reduce((sum, count) => sum + count, 0);
  
  console.log(chalk.blue(`\n🚀 Generating ${totalUsers} users...`));
  
  // Initialize progress bar
  const progressBar = new cliProgress.SingleBar({
    format: chalk.cyan('{bar}') + ' {percentage}% | {value}/{total} users | ETA: {eta}s',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  });

  progressBar.start(totalUsers, 0);

  let processedUsers = 0;

  for (const role of config.roles) {
    const count = config.userCounts[role];
    const users: GeneratedUser[] = [];

    for (let i = 0; i < count; i++) {
      let schoolUdiseCode: string;

      if (config.schoolAssignment === 'specific' && config.specificSchoolId) {
        const school = schoolCache.find(s => s.institutionId === config.specificSchoolId || s.udiseSchoolCode === config.specificSchoolId);
        schoolUdiseCode = school?.udiseSchoolCode || schoolCache[0]?.udiseSchoolCode || 'DEFAULT001';
      } else if (schoolCache.length > 0) {
        // Random school assignment
        const randomSchool = faker.helpers.arrayElement(schoolCache);
        schoolUdiseCode = randomSchool.udiseSchoolCode;
      } else {
        schoolUdiseCode = 'DEFAULT001';
      }

      const user = await generateUser(role, schoolUdiseCode);
      users.push(user);
      
      processedUsers++;
      progressBar.update(processedUsers);
    }

    usersByRole.set(role, users);
  }

  progressBar.stop();
  console.log(chalk.green('\n✅ User generation completed!'));

  return usersByRole;
};

const exportToCSV = async (usersByRole: Map<UserRole, GeneratedUser[]>, config: UserGenerationConfig): Promise<string[]> => {
  const exportedFiles: string[] = [];
  
  try {
    // Ensure output directory exists with robust error handling
    const outputDir = path.resolve(process.cwd(), path.dirname(config.outputPath));
    
    try {
      await fs.mkdir(outputDir, { recursive: true, mode: 0o755 });
      console.log(chalk.green(`✅ Created/verified output directory: ${outputDir}`));
    } catch (dirError) {
      console.error(chalk.red(`❌ Failed to create directory: ${outputDir}`), dirError);
      throw dirError;
    }

    // CSV header
    const csvHeader = 'email,first_name,last_name,role,school_udise_code,phone_number,date_of_birth,admission_year,graduation_year\n';

    // Generate combined CSV
    const allUsers: GeneratedUser[] = [];
    usersByRole.forEach(users => allUsers.push(...users));

    if (allUsers.length > 0) {
      const combinedCSV = csvHeader + allUsers.map(user => 
        `"${user.email}","${user.firstName}","${user.lastName}","${user.role}","${user.schoolUdiseCode}","${user.phoneNumber}","${user.dateOfBirth}","${user.admissionYear || ''}","${user.graduationYear || ''}"`
      ).join('\n');

      const filePath = path.resolve(config.outputPath);
      
      try {
        await fs.writeFile(filePath, combinedCSV, 'utf8');
        
        // Verify file was written
        const stats = await fs.stat(filePath);
        if (stats.size > 0) {
          exportedFiles.push(filePath);
          console.log(chalk.green(`✅ Exported combined CSV: ${filePath} (${stats.size} bytes)`));
        } else {
          console.error(chalk.red(`❌ File written but empty: ${filePath}`));
        }
      } catch (writeError) {
        console.error(chalk.red(`❌ Failed to write combined CSV: ${filePath}`), writeError);
        throw writeError;
      }
    }

    // Generate separate files per role if requested
    if (config.generateSeparateFiles) {
      const baseDir = path.dirname(config.outputPath);
      const baseName = path.basename(config.outputPath, '.csv');

      for (const [role, users] of usersByRole) {
        if (users.length > 0) {
          const roleFileName = path.resolve(baseDir, `${baseName}_${role}s.csv`);
          const roleCSV = csvHeader + users.map(user => 
            `"${user.email}","${user.firstName}","${user.lastName}","${user.role}","${user.schoolUdiseCode}","${user.phoneNumber}","${user.dateOfBirth}","${user.admissionYear || ''}","${user.graduationYear || ''}"`
          ).join('\n');
          
          try {
            await fs.writeFile(roleFileName, roleCSV, 'utf8');
            
            // Verify file was written
            const stats = await fs.stat(roleFileName);
            if (stats.size > 0) {
              exportedFiles.push(roleFileName);
              console.log(chalk.green(`✅ Exported ${role} CSV: ${roleFileName} (${stats.size} bytes)`));
            } else {
              console.error(chalk.red(`❌ File written but empty: ${roleFileName}`));
            }
          } catch (writeError) {
            console.error(chalk.red(`❌ Failed to write ${role} CSV: ${roleFileName}`), writeError);
            throw writeError;
          }
        }
      }
    }

    return exportedFiles;
  } catch (error) {
    console.error(chalk.red('❌ CSV export failed:'), error);
    throw new Error(`CSV export failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const insertIntoDatabase = async (usersByRole: Map<UserRole, GeneratedUser[]>): Promise<void> => {
  console.log(chalk.blue('\n💾 Inserting users into database...'));
  
  try {
    const allUsers: GeneratedUser[] = [];
    usersByRole.forEach(users => allUsers.push(...users));
    
    for (const user of allUsers) {
      // Find the school by UDISE code
      const school = await prisma.school.findFirst({
        where: { udiseSchoolCode: user.schoolUdiseCode }
      });
      
      if (!school) {
        logger.warn(`School not found for UDISE code: ${user.schoolUdiseCode}`);
        continue;
      }
      
      // Create user in database
      await prisma.user.create({
        data: {
          keycloakId: `temp_${user.email}_${Date.now()}`, // temporary - should be set when user logs in
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          dateOfBirth: new Date(user.dateOfBirth),
          schoolId: school.id,
          isActive: true,
          // Add admission/graduation years if applicable
          ...(user.admissionYear && { admissionYear: parseInt(user.admissionYear) }),
          ...(user.graduationYear && { graduationYear: parseInt(user.graduationYear) })
        }
      });
    }
    
    console.log(chalk.green(`✅ Successfully inserted ${allUsers.length} users into database`));
  } catch (error) {
    logger.error('Failed to insert users into database:', error);
    throw new Error(`Database insertion failed: ${error}`);
  }
};

const showPreview = (usersByRole: Map<UserRole, GeneratedUser[]>): void => {
  console.log(chalk.yellow('\n📋 PREVIEW: Sample generated users'));
  console.log(chalk.gray('─'.repeat(80)));

  usersByRole.forEach((users, role) => {
    if (users.length > 0) {
      const sample = users[0];
      const school = schoolCache.find(s => s.udiseSchoolCode === sample.schoolUdiseCode);
      
      console.log(chalk.blue(`${role.toUpperCase()}:`));
      console.log(`  📧 ${sample.email}`);
      console.log(`  👤 ${sample.firstName} ${sample.lastName}`);
      console.log(`  📱 ${sample.phoneNumber}`);
      console.log(`  🎂 ${sample.dateOfBirth} (${new Date().getFullYear() - new Date(sample.dateOfBirth).getFullYear()} years old)`);
      if (sample.admissionYear) console.log(`  🎓 ${sample.admissionYear} - ${sample.graduationYear}`);
      console.log(`  🏫 ${school?.schoolName || sample.schoolUdiseCode} (${sample.schoolUdiseCode})`);
      console.log('');
    }
  });
};

const showSummary = (usersByRole: Map<UserRole, GeneratedUser[]>, exportedFiles: string[]): void => {
  console.log(chalk.green('\n🎉 SUCCESS! User generation completed!'));
  console.log(chalk.gray('─'.repeat(50)));

  // Show user counts by role
  usersByRole.forEach((users, role) => {
    const emoji = role === 'student' ? '🎓' : role === 'teacher' ? '👨‍🏫' : role === 'alumni' ? '🎖️' : role === 'school_admin' ? '🏢' : '⚡';
    console.log(`  ${emoji} ${role.replace('_', ' ').toUpperCase()}: ${users.length} users`);
  });

  const totalUsers = Array.from(usersByRole.values()).reduce((sum, users) => sum + users.length, 0);
  console.log(chalk.cyan(`\n📊 Total generated: ${totalUsers} users`));

  console.log(chalk.blue('\n📁 Exported files:'));
  exportedFiles.forEach(file => {
    console.log(`  ✅ ${file}`);
  });

  console.log(chalk.yellow('\n🚀 Ready for import! Run the following command:'));
  console.log(chalk.green(`./scripts/import_data.sh`));
};

const collectUserInput = async (): Promise<UserGenerationConfig> => {
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'roles',
      message: '🎭 Select roles to generate users for:',
      choices: [
        { name: '⚡ Platform Admin', value: 'platform_admin' },
        { name: '🏢 School Admin', value: 'school_admin' },
        { name: '👨‍🏫 Teacher', value: 'teacher' },
        { name: '🎓 Student', value: 'student' },
        { name: '🎖️ Alumni', value: 'alumni' }
      ],
      default: ['school_admin', 'teacher', 'student', 'alumni']
    }
  ]);

  if (answers.roles.length === 0) {
    console.log(chalk.red('❌ Please select at least one role!'));
    process.exit(1);
  }

  // Collect user counts for each selected role
  const userCounts: Record<UserRole, number> = {} as Record<UserRole, number>;
  
  for (const role of answers.roles) {
    const defaultCount = role === 'platform_admin' ? 1 : 
                        role === 'school_admin' ? 5 :
                        role === 'teacher' ? 15 :
                        role === 'student' ? 100 : 50;

    const countAnswer = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: `🔢 How many ${role.replace('_', ' ')}s to generate?`,
        default: defaultCount,
        validate: (input) => (input && input > 0) || 'Please enter a positive number'
      }
    ]);

    userCounts[role as UserRole] = countAnswer.count;
  }

  // School assignment strategy
  const schoolStrategy = await inquirer.prompt([
    {
      type: 'list',
      name: 'assignment',
      message: '🏫 School assignment strategy:',
      choices: [
        { name: '🎲 Random distribution across all schools', value: 'random' },
        { name: '🎯 Assign to specific school', value: 'specific' }
      ],
      default: 'random'
    }
  ]);

  let specificSchoolId: string | undefined;
  if (schoolStrategy.assignment === 'specific') {
    const schoolChoices = schoolCache.map(school => ({
      name: `${school.schoolName} (${school.udiseSchoolCode}) - ${school.districtName}, ${school.stateName}`,
      value: school.udiseSchoolCode
    }));

    const schoolAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'schoolId',
        message: '🏫 Select target school:',
        choices: schoolChoices,
        pageSize: 10
      }
    ]);

    specificSchoolId = schoolAnswer.schoolId;
  }

  // Export configuration
  const exportConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'outputPath',
      message: '📁 Output file path:',
      default: `./generated_data/fake_users_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.csv`
    },
    {
      type: 'confirm',
      name: 'generateSeparateFiles',
      message: '📄 Generate separate CSV files per role?',
      default: true
    },
    {
      type: 'confirm',
      name: 'previewMode',
      message: '👀 Show preview before generating?',
      default: true
    },
    {
      type: 'confirm',
      name: 'directInsert',
      message: '💾 Insert directly into database? (Skip for CSV-only)',
      default: false
    }
  ]);

  return {
    roles: answers.roles,
    userCounts,
    schoolAssignment: schoolStrategy.assignment,
    specificSchoolId,
    outputPath: exportConfig.outputPath,
    generateSeparateFiles: exportConfig.generateSeparateFiles,
    directInsert: exportConfig.directInsert,
    defaultPassword: 'Test@123',
    previewMode: exportConfig.previewMode
  };
};

const main = async (): Promise<void> => {
  try {
    showBanner();

    // Load schools from database
    await loadSchoolCache();

    if (schoolCache.length === 0) {
      console.log(chalk.red('❌ No schools found in database! Please add schools first.'));
      process.exit(1);
    }

    // Collect user configuration
    const config = await collectUserInput();

    // Generate users
    const usersByRole = await generateUsers(config);

    // Show preview if requested
    if (config.previewMode) {
      showPreview(usersByRole);
      
      const proceed = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: '🤔 Proceed with export?',
          default: true
        }
      ]);

      if (!proceed.continue) {
        console.log(chalk.yellow('⏹️ Generation cancelled.'));
        process.exit(0);
      }
    }

    // Export to CSV
    const exportedFiles = await exportToCSV(usersByRole, config);

    // Direct database insertion (if requested)
    if (config.directInsert) {
      await insertIntoDatabase(usersByRole);
    }

    // Show summary
    showSummary(usersByRole, exportedFiles);

  } catch (error) {
    logger.error('User generation failed:', error);
    console.log(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// CLI execution
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as generateUsers, UserGenerationConfig, GeneratedUser };
