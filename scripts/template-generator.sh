#!/bin/bash

################################################################################
# 🎨 CSV Template Generator for My School Buddies
# Interactive template creation with sample data
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Display banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       🎨 MY SCHOOL BUDDIES - TEMPLATE GENERATOR 🎨          ║
║                                                              ║
║         📋 Create Perfect CSV Templates & Samples 📋        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}🎯 What type of CSV template would you like to create?${NC}"
echo ""
echo -e "${GREEN}  1️⃣  🏫 School Import Template${NC}"
echo -e "     ${YELLOW}├─ Educational institutions data${NC}"
echo -e "     ${YELLOW}└─ UDISE codes, school types, contact info${NC}"
echo ""
echo -e "${GREEN}  2️⃣  👥 User Import Template${NC}"
echo -e "     ${YELLOW}├─ Students, teachers, alumni, admins${NC}"
echo -e "     ${YELLOW}└─ Email, names, roles, school association${NC}"
echo ""
echo -e "${GREEN}  3️⃣  👨‍🎓 Student-Specific Template${NC}"
echo -e "     ${YELLOW}├─ Student-focused fields${NC}"
echo -e "     ${YELLOW}└─ Grades, sections, guardian info${NC}"
echo ""
echo -e "${GREEN}  4️⃣  👩‍🏫 Teacher-Specific Template${NC}"
echo -e "     ${YELLOW}├─ Teacher-focused fields${NC}"
echo -e "     ${YELLOW}└─ Subjects, qualifications, experience${NC}"
echo ""
echo -e "${GREEN}  5️⃣  🎓 Alumni-Specific Template${NC}"
echo -e "     ${YELLOW}├─ Alumni-focused fields${NC}"
echo -e "     ${YELLOW}└─ Graduation years, career info${NC}"
echo ""
echo -e "${GREEN}  6️⃣  🚪 Exit${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
read -rp "🎯 Enter your choice (1-6): " TEMPLATE_TYPE

case "$TEMPLATE_TYPE" in
    "1")
        TEMPLATE_NAME="schools"
        DISPLAY_NAME="🏫 School Import"
        OUTPUT_FILE="school-import-template.csv"
        ;;
    "2")
        TEMPLATE_NAME="users"
        DISPLAY_NAME="👥 User Import"
        OUTPUT_FILE="user-import-template.csv"
        ;;
    "3")
        TEMPLATE_NAME="students"
        DISPLAY_NAME="👨‍🎓 Student Import"
        OUTPUT_FILE="student-import-template.csv"
        ;;
    "4")
        TEMPLATE_NAME="teachers"
        DISPLAY_NAME="👩‍🏫 Teacher Import"
        OUTPUT_FILE="teacher-import-template.csv"
        ;;
    "5")
        TEMPLATE_NAME="alumni"
        DISPLAY_NAME="🎓 Alumni Import"
        OUTPUT_FILE="alumni-import-template.csv"
        ;;
    "6")
        echo ""
        echo -e "${GREEN}👋 Goodbye! Thank you for using the template generator!${NC}"
        echo ""
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Invalid choice. Please select 1-6.${NC}"
        echo ""
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Selected: $DISPLAY_NAME Template${NC}"

# Ask for sample data preference
echo ""
echo -e "${BLUE}📊 Would you like to include sample data?${NC}"
echo ""
echo -e "${GREEN}  1️⃣  📋 Headers Only${NC}"
echo -e "     ${YELLOW}└─ Just column headers (empty template)${NC}"
echo ""
echo -e "${GREEN}  2️⃣  📝 Sample Data (3 rows)${NC}"
echo -e "     ${YELLOW}└─ Headers + 3 example rows${NC}"
echo ""
echo -e "${GREEN}  3️⃣  📊 Extended Sample (10 rows)${NC}"
echo -e "     ${YELLOW}└─ Headers + 10 example rows${NC}"
echo ""
read -rp "🎯 Enter your choice (1-3): " SAMPLE_TYPE

# Ask for output location
echo ""
echo -e "${BLUE}📁 Where would you like to save the template?${NC}"
echo ""
echo -e "${YELLOW}💡 Current directory: ${CYAN}$(pwd)${NC}"
echo ""
read -rp "📄 Enter filename (or press Enter for '$OUTPUT_FILE'): " CUSTOM_FILE

if [ -n "$CUSTOM_FILE" ]; then
    OUTPUT_FILE="$CUSTOM_FILE"
fi

echo ""
echo -e "${CYAN}🔧 Generating Template...${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

# Generate templates based on type
case "$TEMPLATE_NAME" in
    "schools")
        # School template
        echo "name,udise_code,school_type,management_type,address,contact_number,email,principal_name,establishment_year" > "$OUTPUT_FILE"
        
        if [ "$SAMPLE_TYPE" != "1" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Delhi Public School","DPS001","Higher Secondary","Private","123 Main Street, New Delhi, 110001","+91-11-12345678","info@dps001.edu","Dr. Rajesh Sharma","1985"
"Government Senior Secondary School","GSSS002","Higher Secondary","Government","456 School Road, Mumbai, 400001","+91-22-87654321","principal@gsss002.gov.in","Mrs. Priya Patel","1962"
"St. Mary's Convent School","SMCS003","Secondary","Private","789 Church Lane, Bangalore, 560001","+91-80-11111111","admin@stmarys003.edu","Sister Margaret","1978"
EOF
        fi
        
        if [ "$SAMPLE_TYPE" == "3" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Kendriya Vidyalaya","KV004","Higher Secondary","Central Government","101 Army Campus, Pune, 411001","+91-20-22222222","kv004@kvs.gov.in","Mr. Suresh Kumar","1970"
"DAV Public School","DAV005","Higher Secondary","Private","202 Civil Lines, Lucknow, 226001","+91-522-33333333","principal@dav005.edu","Mrs. Sunita Agarwal","1988"
"Jawahar Navodaya Vidyalaya","JNV006","Higher Secondary","Central Government","303 Rural Area, Dehradun, 248001","+91-135-44444444","jnv006@navodaya.gov.in","Dr. Amit Verma","1992"
"Modern School","MS007","Higher Secondary","Private","404 Central Delhi, New Delhi, 110001","+91-11-55555555","info@modern007.edu","Mr. Vikash Gupta","1980"
"Sarvodaya Vidyalaya","SV008","Higher Secondary","Government","505 East Delhi, New Delhi, 110092","+91-11-66666666","sv008@edudel.nic.in","Mrs. Kavita Singh","1975"
"Ryan International School","RIS009","Higher Secondary","Private","606 Vasant Kunj, New Delhi, 110070","+91-11-77777777","ryan009@ryangroup.org","Dr. Meera Jain","1995"
"Amity International School","AIS010","Higher Secondary","Private","707 Sector 46, Gurgaon, 122003","+91-124-88888888","ais010@amity.edu","Mr. Rohit Khanna","2000"
EOF
        fi
        ;;
        
    "users")
        # User template
        echo "email,first_name,last_name,role,school_udise_code,phone_number,date_of_birth,admission_year,graduation_year" > "$OUTPUT_FILE"
        
        if [ "$SAMPLE_TYPE" != "1" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"john.doe@example.com","John","Doe","student","DPS001","+91-98765-43210","2005-05-15","2020","2024"
"jane.smith@example.com","Jane","Smith","teacher","DPS001","+91-98765-43211","1985-08-20","","",
"alumni.user@example.com","Alumni","User","alumni","DPS001","+91-98765-43212","1990-12-10","2005","2009"
EOF
        fi
        
        if [ "$SAMPLE_TYPE" == "3" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"admin.school@example.com","School","Admin","school_admin","DPS001","+91-98765-43213","1980-03-25","","",
"rahul.sharma@example.com","Rahul","Sharma","student","GSSS002","+91-98765-43214","2006-07-18","2021","2025"
"priya.patel@example.com","Priya","Patel","teacher","GSSS002","+91-98765-43215","1988-11-30","","",
"amit.kumar@example.com","Amit","Kumar","alumni","SMCS003","+91-98765-43216","1995-02-14","2010","2014"
"sunita.agarwal@example.com","Sunita","Agarwal","teacher","KV004","+91-98765-43217","1982-09-05","","",
"vikash.gupta@example.com","Vikash","Gupta","school_admin","DAV005","+91-98765-43218","1975-12-12","","",
"kavita.singh@example.com","Kavita","Singh","platform_admin","","91-98765-43219","1978-06-28","","",
EOF
        fi
        ;;
        
    "students")
        # Student-specific template
        echo "firstName,lastName,email,phone,dateOfBirth,grade,section,rollNumber,guardianName,guardianPhone,address,school_udise_code" > "$OUTPUT_FILE"
        
        if [ "$SAMPLE_TYPE" != "1" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Rahul","Sharma","rahul.sharma@example.com","9876543210","2008-05-15","10","A","101","Suresh Sharma","9876543211","123 Main Street, Delhi","DPS001"
"Priya","Patel","priya.patel@example.com","9876543212","2008-08-22","10","B","102","Rajesh Patel","9876543213","456 Park Road, Mumbai","GSSS002"
"Amit","Kumar","amit.kumar@example.com","9876543214","2007-12-10","11","A","201","Vinod Kumar","9876543215","789 School Lane, Bangalore","SMCS003"
EOF
        fi
        
        if [ "$SAMPLE_TYPE" == "3" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Sneha","Singh","sneha.singh@example.com","9876543216","2007-03-18","11","B","202","Prakash Singh","9876543217","321 College Street, Chennai","KV004"
"Arjun","Verma","arjun.verma@example.com","9876543218","2006-07-25","12","A","301","Anil Verma","9876543219","654 University Road, Pune","DAV005"
"Anita","Joshi","anita.joshi@example.com","9876543220","2008-01-30","10","C","103","Ramesh Joshi","9876543221","987 Housing Colony, Jaipur","JNV006"
"Deepak","Yadav","deepak.yadav@example.com","9876543222","2007-09-12","11","C","203","Mahesh Yadav","9876543223","147 New Area, Indore","MS007"
"Pooja","Gupta","pooja.gupta@example.com","9876543224","2006-11-08","12","B","302","Suresh Gupta","9876543225","258 Old City, Agra","SV008"
"Ravi","Sharma","ravi.sharma@example.com","9876543226","2008-04-22","10","D","104","Dinesh Sharma","9876543227","369 Green Park, Kanpur","RIS009"
"Meera","Singh","meera.singh@example.com","9876543228","2007-06-15","11","D","204","Rajesh Singh","9876543229","741 Sector 12, Noida","AIS010"
EOF
        fi
        ;;
        
    "teachers")
        # Teacher-specific template
        echo "firstName,lastName,email,phone,dateOfBirth,subject,qualification,experience,employeeId,department,joiningDate,school_udise_code" > "$OUTPUT_FILE"
        
        if [ "$SAMPLE_TYPE" != "1" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Dr. Sunita","Sharma","sunita.sharma@school.edu","9876543220","1985-04-12","Mathematics","M.Sc. Mathematics","10","EMP001","Mathematics","2020-07-01","DPS001"
"Mr. Rajesh","Kumar","rajesh.kumar@school.edu","9876543221","1982-09-18","Physics","M.Sc. Physics","15","EMP002","Science","2018-06-15","DPS001"
"Mrs. Meera","Patel","meera.patel@school.edu","9876543222","1987-11-25","English","M.A. English","8","EMP003","English","2021-08-10","GSSS002"
EOF
        fi
        
        if [ "$SAMPLE_TYPE" == "3" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Mr. Vikram","Singh","vikram.singh@school.edu","9876543223","1980-01-30","Chemistry","M.Sc. Chemistry","18","EMP004","Science","2016-04-20","GSSS002"
"Ms. Anita","Verma","anita.verma@school.edu","9876543224","1990-06-08","History","M.A. History","5","EMP005","Social Studies","2022-09-05","SMCS003"
"Dr. Amit","Joshi","amit.joshi@school.edu","9876543225","1975-12-20","Biology","Ph.D. Biology","20","EMP006","Science","2015-03-15","KV004"
"Mrs. Priya","Agarwal","priya.agarwal@school.edu","9876543226","1983-07-14","Hindi","M.A. Hindi","12","EMP007","Languages","2019-01-10","DAV005"
"Mr. Suresh","Gupta","suresh.gupta@school.edu","9876543227","1978-05-28","Computer Science","M.Tech. CSE","16","EMP008","Computer Science","2017-08-22","JNV006"
"Ms. Kavita","Yadav","kavita.yadav@school.edu","9876543228","1986-10-03","Geography","M.A. Geography","9","EMP009","Social Studies","2020-11-12","MS007"
"Dr. Rohit","Khanna","rohit.khanna@school.edu","9876543229","1973-02-16","Principal","M.Ed., Ph.D.","25","EMP010","Administration","2012-06-01","SV008"
EOF
        fi
        ;;
        
    "alumni")
        # Alumni-specific template
        echo "firstName,lastName,email,phone,dateOfBirth,graduationYear,degree,currentCompany,currentPosition,city,country,school_udise_code" > "$OUTPUT_FILE"
        
        if [ "$SAMPLE_TYPE" != "1" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Ravi","Sharma","ravi.sharma@techcorp.com","9876543230","1992-03-15","2010","Computer Science","TechCorp Solutions","Software Engineer","Bangalore","India","DPS001"
"Anjali","Patel","anjali.patel@consulting.com","9876543231","1991-07-22","2009","Business Administration","Global Consulting","Business Analyst","Mumbai","India","DPS001"
"Vikash","Kumar","vikash.kumar@startup.com","9876543232","1993-11-08","2011","Electronics Engineering","InnovateTech","Product Manager","Delhi","India","GSSS002"
EOF
        fi
        
        if [ "$SAMPLE_TYPE" == "3" ]; then
            cat >> "$OUTPUT_FILE" << EOF
"Neha","Singh","neha.singh@medical.com","9876543233","1990-05-18","2008","Medicine","City Hospital","Doctor","Chennai","India","SMCS003"
"Arjun","Verma","arjun.verma@finance.com","9876543234","1989-09-30","2007","Finance","Investment Bank","Financial Analyst","Mumbai","India","KV004"
"Priyanka","Joshi","priyanka.joshi@university.edu","9876543235","1988-12-12","2006","Literature","State University","Professor","Pune","India","DAV005"
"Rahul","Agarwal","rahul.agarwal@design.com","9876543236","1994-04-25","2012","Fine Arts","Creative Agency","Graphic Designer","Bangalore","India","JNV006"
"Sunita","Yadav","sunita.yadav@law.com","9876543237","1987-08-14","2005","Law","Legal Associates","Lawyer","Delhi","India","MS007"
"Amit","Gupta","amit.gupta@research.org","9876543238","1985-01-20","2003","Physics","Research Institute","Research Scientist","Bangalore","India","SV008"
"Meera","Khanna","meera.khanna@usa.com","9876543239","1992-06-18","2010","Computer Engineering","Tech Giant","Software Developer","San Francisco","USA","RIS009"
EOF
        fi
        ;;
esac

# Success message
echo ""
echo -e "${GREEN}✅ Template Generated Successfully!${NC}"
echo ""
echo -e "${BLUE}📄 File Details:${NC}"
echo -e "   📁 File: ${CYAN}$OUTPUT_FILE${NC}"
echo -e "   📊 Type: ${CYAN}$DISPLAY_NAME${NC}"
echo -e "   📋 Rows: ${CYAN}$(wc -l < "$OUTPUT_FILE")${NC} (including header)"

# Display file content preview
echo ""
echo -e "${BLUE}📋 Template Preview:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
head -n 3 "$OUTPUT_FILE" | while IFS= read -r line; do
    echo -e "${YELLOW}$line${NC}"
done
if [ "$(wc -l < "$OUTPUT_FILE")" -gt 3 ]; then
    echo -e "${BLUE}... (and more rows)${NC}"
fi
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

# Usage instructions
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo -e "${GREEN}1. Customize Your Data:${NC}"
echo -e "   ${BLUE}• Edit $OUTPUT_FILE with your actual data${NC}"
echo -e "   ${BLUE}• Keep the header row exactly as is${NC}"
echo -e "   ${BLUE}• Follow the sample data format${NC}"
echo ""
echo -e "${GREEN}2. Validate Before Import:${NC}"
echo -e "   ${CYAN}./scripts/csv-validator.sh $OUTPUT_FILE${NC}"
echo ""
echo -e "${GREEN}3. Import Your Data:${NC}"
echo -e "   ${CYAN}./scripts/import_data.sh${NC}"
echo ""

# Helpful tips
echo -e "${YELLOW}💡 Pro Tips:${NC}"
echo -e "   ${BLUE}• Save file as UTF-8 encoding${NC}"
echo -e "   ${BLUE}• Use quotes for fields containing commas${NC}"
echo -e "   ${BLUE}• Date format: YYYY-MM-DD${NC}"
echo -e "   ${BLUE}• Phone format: +91-XXXXX-XXXXX${NC}"
echo -e "   ${BLUE}• Email must be unique across all users${NC}"
if [ "$TEMPLATE_NAME" != "schools" ]; then
    echo -e "   ${BLUE}• School UDISE codes must exist in database${NC}"
fi

echo ""
echo -e "${GREEN}🌟 Template creation completed! Happy importing! 🌟${NC}"
echo ""