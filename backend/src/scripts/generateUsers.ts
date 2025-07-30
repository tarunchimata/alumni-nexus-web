#!/usr/bin/env ts-node

import { PrismaClient, UserRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import inquirer from 'inquirer';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

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
  id: string;
  schoolName: string;
  udiseSchoolCode: string;
  state: string;
  district: string;
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

// Faker helpers for Indian-style data
class FakerHelpers {
  static getIndianName(): { firstName: string; lastName: string } {
    const indianFirstNames = [
      'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
      'Anaya', 'Diya', 'Priya', 'Kavya', 'Anika', 'Saanvi', 'Aadhya', 'Kiara', 'Sara', 'Myra',
      'Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Mukesh', 'Naresh', 'Umesh', 'Ritesh', 'Ganesh',
      'Sunita', 'Geeta', 'Seeta', 'Rita', 'Anita', 'Kavita', 'Lalita', 'Sangita', 'Mamta', 'Shanti'
    ];

    const indianLastNames = [
      'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Agarwal', 'Jain', 'Bansal', 'Garg', 'Mittal',
      'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Pandya', 'Thakkar', 'Trivedi', 'Vyas',
      'Reddy', 'Rao', 'Naidu', 'Murthy', 'Prasad', 'Raju', 'Krishna', 'Srinivas', 'Venkat', 'Ramesh',
      'Iyer', 'Nair', 'Menon', 'Pillai', 'Krishnan', 'Raman', 'Swamy', 'Bhat', 'Rao', 'Shetty'
    ];

    return {
      firstName: faker.helpers.arrayElement(indianFirstNames),
      lastName: faker.helpers.arrayElement(indianLastNames)
    };
  }

  static getIndianPhoneNumber(): string {
    const prefixes = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
    const prefix = faker.helpers.arrayElement(prefixes);
    const number = faker.string.numeric(8);
    return `+91-${prefix}${number.slice(0, 3)}-${number.slice(3)}`;
  }

  static getEmailDomain(): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'email.com'];
    return faker.helpers.arrayElement(domains);
  }

  static getDateOfBirthByRole(role: UserRole): Date {
    const currentYear = new Date().getFullYear();
    let minAge: number, maxAge: number;

    switch (role) {
      case 'student':
        minAge = 15; maxAge = 19; // Ages 15-19
        break;
      case 'alumni':
        minAge = 22; maxAge = 40; // Ages 22-40
        break;
      case 'teacher':
        minAge = 25; maxAge = 60; // Ages 25-60
        break;
      case 'school_admin':
        minAge = 30; maxAge = 65; // Ages 30-65
        break;
      case 'platform_admin':
        minAge = 25; maxAge = 50; // Ages 25-50
        break;
      default:
        minAge = 20; maxAge = 65;
    }

    const birthYear = currentYear - faker.number.int({ min: minAge, max: maxAge });
    return faker.date.birthdate({ min: birthYear, max: birthYear, mode: 'year' });
  }

  static getAcademicYears(role: UserRole, dateOfBirth: Date): { admissionYear?: string; graduationYear?: string } {
    const birthYear = dateOfBirth.getFullYear();
    const currentYear = new Date().getFullYear();

    switch (role) {
      case 'student': {
        const age = currentYear - birthYear;
        const admissionYear = currentYear - (age - 15); // Assuming admission at age 15
        const graduationYear = admissionYear + 4; // 4-year program
        return {
          admissionYear: admissionYear.toString(),
          graduationYear: graduationYear.toString()
        };
      }
      case 'alumni': {
        const graduationAge = faker.number.int({ min: 18, max: 24 });
        const graduationYear = birthYear + graduationAge;
        const admissionYear = graduationYear - 4;
        return {
          admissionYear: admissionYear.toString(),
          graduationYear: graduationYear.toString()
        };
      }
      default:
        return {};
    }
  }
}

// School cache for efficient lookup
let schoolCache: SchoolInfo[] = [];

const loadSchoolCache = async (): Promise<void> => {
  console.log(chalk.blue('📚 Loading schools from database...'));
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        schoolName: true,
        udiseSchoolCode: true,
        state: true,
        district: true
      }
    });

    schoolCache = schools.map(school => ({
      id: school.id,
      schoolName: school.schoolName,
      udiseSchoolCode: school.udiseSchoolCode,
      state: school.state || 'Unknown',
      district: school.district || 'Unknown'
    }));

    console.log(chalk.green(`✅ Loaded ${schoolCache.length} schools`));
  } catch (error) {
    logger.error('Failed to load schools:', error);
    throw new Error('Could not connect to database to load schools');
  }
};

const generateUser = async (role: UserRole, schoolUdiseCode: string): Promise<GeneratedUser> => {
  const { firstName, lastName } = FakerHelpers.getIndianName();
  const dateOfBirth = FakerHelpers.getDateOfBirthByRole(role);
  const academicYears = FakerHelpers.getAcademicYears(role, dateOfBirth);
  
  // Generate unique email
  const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const randomSuffix = faker.number.int({ min: 1000, max: 9999 });
  const email = `${emailBase}.${randomSuffix}@${FakerHelpers.getEmailDomain()}`;

  return {
    email,
    firstName,
    lastName,
    role,
    schoolUdiseCode,
    phoneNumber: FakerHelpers.getIndianPhoneNumber(),
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
        const school = schoolCache.find(s => s.id === config.specificSchoolId || s.udiseSchoolCode === config.specificSchoolId);
        schoolUdiseCode = school?.udiseSchoolCode || schoolCache[0]?.udiseSchoolCode || 'DEFAULT001';
      } else {
        // Random school assignment
        const randomSchool = faker.helpers.arrayElement(schoolCache);
        schoolUdiseCode = randomSchool.udiseSchoolCode;
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
  
  // Ensure output directory exists
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // CSV header
  const csvHeader = 'email,first_name,last_name,role,school_udise_code,phone_number,date_of_birth,admission_year,graduation_year\n';

  // Generate combined CSV
  const allUsers: GeneratedUser[] = [];
  usersByRole.forEach(users => allUsers.push(...users));

  const combinedCSV = csvHeader + allUsers.map(user => 
    `"${user.email}","${user.firstName}","${user.lastName}","${user.role}","${user.schoolUdiseCode}","${user.phoneNumber}","${user.dateOfBirth}","${user.admissionYear}","${user.graduationYear}"`
  ).join('\n');

  fs.writeFileSync(config.outputPath, combinedCSV);
  exportedFiles.push(config.outputPath);

  // Generate separate files per role if requested
  if (config.generateSeparateFiles) {
    const baseDir = path.dirname(config.outputPath);
    const baseName = path.basename(config.outputPath, '.csv');

    usersByRole.forEach((users, role) => {
      const roleFileName = path.join(baseDir, `${baseName}_${role}s.csv`);
      const roleCSV = csvHeader + users.map(user => 
        `"${user.email}","${user.firstName}","${user.lastName}","${user.role}","${user.schoolUdiseCode}","${user.phoneNumber}","${user.dateOfBirth}","${user.admissionYear}","${user.graduationYear}"`
      ).join('\n');
      
      fs.writeFileSync(roleFileName, roleCSV);
      exportedFiles.push(roleFileName);
    });
  }

  return exportedFiles;
};

const showPreview = (usersByRole: Map<UserRole, GeneratedUser[]>): void => {
  console.log(chalk.yellow('\n📋 PREVIEW: Sample generated users'));
  console.log(chalk.gray('─'.repeat(80)));

  usersByRole.forEach((users, role) => {
    if (users.length > 0) {
      const sample = users[0];
      console.log(chalk.blue(`${role.toUpperCase()}:`));
      console.log(`  📧 ${sample.email}`);
      console.log(`  👤 ${sample.firstName} ${sample.lastName}`);
      console.log(`  📱 ${sample.phoneNumber}`);
      console.log(`  🎂 ${sample.dateOfBirth} (${new Date().getFullYear() - new Date(sample.dateOfBirth).getFullYear()} years old)`);
      if (sample.admissionYear) console.log(`  🎓 ${sample.admissionYear} - ${sample.graduationYear}`);
      console.log(`  🏫 ${sample.schoolUdiseCode}`);
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
        validate: (input) => input > 0 || 'Please enter a positive number'
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
      name: `${school.schoolName} (${school.udiseSchoolCode}) - ${school.district}, ${school.state}`,
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
      console.log(chalk.blue('\n💾 Inserting users into database...'));
      // TODO: Implement direct database insertion
      console.log(chalk.yellow('⚠️ Direct database insertion not implemented yet. Use CSV import instead.'));
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