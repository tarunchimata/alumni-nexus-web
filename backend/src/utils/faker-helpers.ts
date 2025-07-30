import { faker } from '@faker-js/faker';
import { UserRole } from '@prisma/client';

/**
 * Helper utilities for generating realistic Indian/South Asian fake data
 * Optimized for the My School Buddies platform
 */

export class FakerHelpers {
  // Comprehensive Indian name datasets
  private static readonly INDIAN_MALE_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Rudra', 'Kiaan', 'Aadhya', 'Pranav', 'Veer', 'Aarush', 'Daksh',
    'Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Mukesh', 'Naresh', 'Umesh', 'Ritesh', 'Ganesh',
    'Vikram', 'Ravi', 'Amit', 'Rohit', 'Ankit', 'Rahul', 'Karan', 'Varun', 'Nitin', 'Deepak',
    'Harish', 'Manish', 'Ashish', 'Rakesh', 'Yogesh', 'Ramesh', 'Girish', 'Jagdish', 'Prakash', 'Subhash'
  ];

  private static readonly INDIAN_FEMALE_NAMES = [
    'Anaya', 'Diya', 'Priya', 'Kavya', 'Anika', 'Saanvi', 'Aadhya', 'Kiara', 'Sara', 'Myra',
    'Pari', 'Arya', 'Navya', 'Zara', 'Riya', 'Ira', 'Tara', 'Nisha', 'Aditi', 'Shreya',
    'Sunita', 'Geeta', 'Seeta', 'Rita', 'Anita', 'Kavita', 'Lalita', 'Sangita', 'Mamta', 'Shanti',
    'Pooja', 'Meera', 'Neeta', 'Kiran', 'Rekha', 'Usha', 'Sita', 'Gita', 'Lata', 'Asha',
    'Deepika', 'Priyanka', 'Sneha', 'Preeti', 'Swati', 'Divya', 'Shweta', 'Neha', 'Anjali', 'Sapna'
  ];

  private static readonly INDIAN_SURNAMES = [
    // North Indian surnames
    'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Agarwal', 'Jain', 'Bansal', 'Garg', 'Mittal',
    'Chopra', 'Malhotra', 'Arora', 'Kapoor', 'Sethi', 'Khanna', 'Bhatia', 'Sood', 'Tandon', 'Goyal',
    
    // Western Indian surnames  
    'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Pandya', 'Thakkar', 'Trivedi', 'Vyas',
    'Gandhi', 'Parikh', 'Shukla', 'Dave', 'Amin', 'Bhatt', 'Chokshi', 'Dalal', 'Gajjar', 'Khatri',
    
    // South Indian surnames
    'Reddy', 'Rao', 'Naidu', 'Murthy', 'Prasad', 'Raju', 'Krishna', 'Srinivas', 'Venkat', 'Ramesh',
    'Iyer', 'Nair', 'Menon', 'Pillai', 'Krishnan', 'Raman', 'Swamy', 'Bhat', 'Shetty', 'Hegde',
    
    // Eastern Indian surnames
    'Chatterjee', 'Mukherjee', 'Banerjee', 'Ghosh', 'Roy', 'Sengupta', 'Bose', 'Das', 'Dutta', 'Paul'
  ];

  private static readonly EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com',
    'email.com', 'ymail.com', 'live.com', 'protonmail.com', 'zoho.com'
  ];

  private static readonly INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna',
    'Vadodara', 'Coimbatore', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot'
  ];

  private static readonly INDIAN_STATES = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  /**
   * Generate realistic Indian name based on gender preference
   */
  static generateIndianName(genderHint?: 'male' | 'female'): { firstName: string; lastName: string } {
    let firstName: string;
    
    if (genderHint === 'male') {
      firstName = faker.helpers.arrayElement(this.INDIAN_MALE_NAMES);
    } else if (genderHint === 'female') {
      firstName = faker.helpers.arrayElement(this.INDIAN_FEMALE_NAMES);
    } else {
      // Random gender selection
      const allNames = [...this.INDIAN_MALE_NAMES, ...this.INDIAN_FEMALE_NAMES];
      firstName = faker.helpers.arrayElement(allNames);
    }
    
    const lastName = faker.helpers.arrayElement(this.INDIAN_SURNAMES);
    
    return { firstName, lastName };
  }

  /**
   * Generate Indian mobile phone number in +91 format
   */
  static generateIndianPhoneNumber(): string {
    // Valid Indian mobile prefixes
    const mobilePrefix = faker.helpers.arrayElement([
      '98', '99', '97', '96', '95', '94', '93', '92', '91', '90',
      '89', '88', '87', '86', '85', '84', '83', '82', '81', '80'
    ]);
    
    const number = faker.string.numeric(8);
    return `+91-${mobilePrefix}${number.slice(0, 3)}-${number.slice(3)}`;
  }

  /**
   * Generate email address with Indian name base
   */
  static generateEmailAddress(firstName: string, lastName: string): string {
    const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const randomSuffix = faker.number.int({ min: 100, max: 9999 });
    const domain = faker.helpers.arrayElement(this.EMAIL_DOMAINS);
    
    return `${baseEmail}.${randomSuffix}@${domain}`;
  }

  /**
   * Generate age-appropriate date of birth based on user role
   */
  static generateDateOfBirth(role: UserRole): Date {
    const currentYear = new Date().getFullYear();
    let minAge: number, maxAge: number;

    switch (role) {
      case 'student':
        minAge = 15; 
        maxAge = 19; // Current students typically 15-19 years old
        break;
        
      case 'alumni':
        minAge = 22; 
        maxAge = 40; // Alumni typically 22-40 years old
        break;
        
      case 'teacher':
        minAge = 25; 
        maxAge = 60; // Teachers typically 25-60 years old
        break;
        
      case 'school_admin':
        minAge = 30; 
        maxAge = 65; // School admins typically 30-65 years old
        break;
        
      case 'platform_admin':
        minAge = 25; 
        maxAge = 50; // Platform admins typically 25-50 years old
        break;
        
      default:
        minAge = 20; 
        maxAge = 65;
    }

    const age = faker.number.int({ min: minAge, max: maxAge });
    const birthYear = currentYear - age;
    
    return faker.date.birthdate({ 
      min: birthYear, 
      max: birthYear, 
      mode: 'year' 
    });
  }

  /**
   * Generate academic years (admission/graduation) based on role and age
   */
  static generateAcademicYears(role: UserRole, dateOfBirth: Date): { 
    admissionYear?: string; 
    graduationYear?: string 
  } {
    const birthYear = dateOfBirth.getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    switch (role) {
      case 'student': {
        // Current students - admission in recent years, graduation in future
        const typicalAdmissionAge = 15;
        const courseDuration = 4; // 4-year course
        
        const admissionYear = birthYear + typicalAdmissionAge;
        const graduationYear = admissionYear + courseDuration;
        
        return {
          admissionYear: admissionYear.toString(),
          graduationYear: graduationYear.toString()
        };
      }
      
      case 'alumni': {
        // Alumni - both admission and graduation in the past
        const admissionAge = faker.number.int({ min: 15, max: 18 });
        const courseDuration = faker.number.int({ min: 3, max: 5 }); // 3-5 year courses
        
        const admissionYear = birthYear + admissionAge;
        const graduationYear = admissionYear + courseDuration;
        
        // Ensure graduation was in the past
        if (graduationYear >= currentYear) {
          const adjustedGraduationYear = currentYear - faker.number.int({ min: 1, max: 10 });
          const adjustedAdmissionYear = adjustedGraduationYear - courseDuration;
          
          return {
            admissionYear: adjustedAdmissionYear.toString(),
            graduationYear: adjustedGraduationYear.toString()
          };
        }
        
        return {
          admissionYear: admissionYear.toString(),
          graduationYear: graduationYear.toString()
        };
      }
      
      default:
        // Teachers, admins don't need academic years in this context
        return {};
    }
  }

  /**
   * Generate Indian address
   */
  static generateIndianAddress(): {
    street: string;
    city: string;
    state: string;
    pincode: string;
  } {
    const houseNumber = faker.number.int({ min: 1, max: 999 });
    const streetNames = [
      'Main Road', 'Gandhi Road', 'MG Road', 'Station Road', 'Church Street',
      'Temple Street', 'Market Road', 'Cross Road', 'Ring Road', 'Bypass Road'
    ];
    
    const street = `${houseNumber}, ${faker.helpers.arrayElement(streetNames)}`;
    const city = faker.helpers.arrayElement(this.INDIAN_CITIES);
    const state = faker.helpers.arrayElement(this.INDIAN_STATES);
    const pincode = faker.string.numeric(6);
    
    return { street, city, state, pincode };
  }

  /**
   * Generate realistic school grade/class for students
   */
  static generateStudentGrade(): string {
    const grades = ['9th', '10th', '11th', '12th', 'Pre-University', 'Diploma'];
    return faker.helpers.arrayElement(grades);
  }

  /**
   * Generate teacher subject specialization
   */
  static generateTeacherSubject(): string {
    const subjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
      'History', 'Geography', 'Economics', 'Political Science', 'Computer Science',
      'Physical Education', 'Art', 'Music', 'Sanskrit', 'Social Studies'
    ];
    return faker.helpers.arrayElement(subjects);
  }

  /**
   * Generate professional designation for school staff
   */
  static generateStaffDesignation(role: UserRole): string {
    switch (role) {
      case 'teacher':
        return faker.helpers.arrayElement([
          'Assistant Teacher', 'Senior Teacher', 'Head of Department',
          'Subject Coordinator', 'Class Teacher', 'Activity Coordinator'
        ]);
        
      case 'school_admin':
        return faker.helpers.arrayElement([
          'Principal', 'Vice Principal', 'Academic Coordinator',
          'Administrative Officer', 'Student Counselor', 'Librarian'
        ]);
        
      default:
        return 'Staff Member';
    }
  }

  /**
   * Generate realistic graduation degree for alumni
   */
  static generateAlumniDegree(): string {
    const degrees = [
      'Bachelor of Science', 'Bachelor of Arts', 'Bachelor of Commerce',
      'Bachelor of Engineering', 'Bachelor of Technology', 'Bachelor of Computer Applications',
      'Master of Science', 'Master of Arts', 'Master of Commerce',
      'Master of Business Administration', 'Master of Technology'
    ];
    return faker.helpers.arrayElement(degrees);
  }

  /**
   * Validate generated data for consistency
   */
  static validateUserData(userData: any): boolean {
    // Basic validation checks
    if (!userData.email || !userData.firstName || !userData.lastName) {
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return false;
    }
    
    // Phone number validation (Indian format)
    const phoneRegex = /^\+91-\d{5}-\d{5}$/;
    if (!phoneRegex.test(userData.phoneNumber)) {
      return false;
    }
    
    // Date of birth validation
    const dob = new Date(userData.dateOfBirth);
    const currentYear = new Date().getFullYear();
    const birthYear = dob.getFullYear();
    
    if (birthYear < 1950 || birthYear > currentYear) {
      return false;
    }
    
    return true;
  }
}

export default FakerHelpers;