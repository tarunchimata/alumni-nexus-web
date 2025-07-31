#!/bin/bash

# My School Buddies - Fake User Generator
# Interactive wrapper script for the bulk user generation system

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# ASCII Art Banner
show_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
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
                                                                              
EOF
    echo -e "${NC}"
    echo -e "          ${YELLOW}🎭 FAKE USER GENERATOR${NC} ${GRAY}v1.0${NC}"
    echo -e "          ${BLUE}Generate realistic test data for your platform${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if we're in the correct directory
    if [ ! -f "backend/package.json" ]; then
        echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Error: Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check if backend dependencies are installed
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        cd backend && npm install && cd ..
    fi
    
    # Check if the generate script exists
    if [ ! -f "backend/src/scripts/generateUsers.ts" ]; then
        echo -e "${RED}❌ Error: generateUsers.ts script not found${NC}"
        echo -e "${GRAY}   Expected: backend/src/scripts/generateUsers.ts${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
    echo ""
}

# Show quick start menu
show_menu() {
    echo -e "${WHITE}🚀 QUICK START OPTIONS${NC}"
    echo -e "${GRAY}─────────────────────────────────────────────────────────────${NC}"
    echo ""
    echo -e "${CYAN}1.${NC} ${WHITE}🎯 Interactive Generation${NC}    - Full wizard with all options"
    echo -e "${CYAN}2.${NC} ${WHITE}⚡ Quick Demo Data${NC}           - Generate sample data instantly"
    echo -e "${CYAN}3.${NC} ${WHITE}🏫 School-Specific Users${NC}     - Target specific school"
    echo -e "${CYAN}4.${NC} ${WHITE}📊 Large Dataset${NC}             - Generate thousands of users"
    echo -e "${CYAN}5.${NC} ${WHITE}🛠️  Custom Configuration${NC}     - Advanced options"
    echo -e "${CYAN}6.${NC} ${WHITE}❓ Help & Documentation${NC}     - View usage guide"
    echo -e "${CYAN}7.${NC} ${WHITE}🚪 Exit${NC}"
    echo ""
    
    read -p "$(echo -e ${WHITE}Choose an option [1-7]:${NC} )" choice
    
    case $choice in
        1) interactive_generation ;;
        2) quick_demo_data ;;
        3) school_specific_users ;;
        4) large_dataset ;;
        5) custom_configuration ;;
        6) show_help ;;
        7) echo -e "${YELLOW}👋 Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Invalid option. Please try again.${NC}"; show_menu ;;
    esac
}

# Interactive generation (full wizard)
interactive_generation() {
    echo -e "${BLUE}🎭 Starting interactive user generation...${NC}"
    echo ""
    
    cd backend
    npm run generate-users
    cd ..
    
    echo ""
    echo -e "${GREEN}🎉 Interactive generation completed!${NC}"
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "   ${WHITE}1.${NC} Review the generated CSV files"
    echo -e "   ${WHITE}2.${NC} Run ${CYAN}./scripts/import_data.sh${NC} to import users"
    echo -e "   ${WHITE}3.${NC} Test login with generated credentials"
    echo ""
    
    read -p "$(echo -e ${WHITE}Press Enter to continue...${NC})"
    show_menu
}

# Quick demo data generation
quick_demo_data() {
    echo -e "${YELLOW}⚡ Generating quick demo data...${NC}"
    echo -e "${GRAY}   • 2 School Admins${NC}"
    echo -e "${GRAY}   • 10 Teachers${NC}"
    echo -e "${GRAY}   • 50 Students${NC}"
    echo -e "${GRAY}   • 25 Alumni${NC}"
    echo ""
    
    # Create output directory
    mkdir -p generated_data
    
    # Run the generation script with predefined settings
    cd backend
    
    # Create a temporary script for quick generation
    cat > temp_quick_gen.js << 'EOF'
const { exec } = require('child_process');

// Simulate user input for quick demo
const inputs = [
    '2,3,4', // Select school_admin, teacher, student, alumni
    '2',     // School admin count
    '10',    // Teacher count  
    '50',    // Student count
    '25',    // Alumni count
    '0',     // Random school assignment
    '',      // Default output path
    'Y',     // Generate separate files
    'N',     // Skip preview
    'N'      // Skip direct insert
].join('\n');

const child = exec('npm run generate-users', (error, stdout, stderr) => {
    if (error) {
        console.error('Generation failed:', error);
        process.exit(1);
    }
    console.log(stdout);
});

child.stdin.write(inputs);
child.stdin.end();
EOF
    
    node temp_quick_gen.js
    rm temp_quick_gen.js
    
    cd ..
    
    echo -e "${GREEN}✅ Quick demo data generated!${NC}"
    read -p "$(echo -e ${WHITE}Press Enter to continue...${NC})"
    show_menu
}

# School-specific user generation
school_specific_users() {
    echo -e "${BLUE}🏫 School-specific user generation${NC}"
    echo ""
    echo -e "${YELLOW}This will help you generate users for a specific school.${NC}"
    echo ""
    
    interactive_generation
}

# Large dataset generation
large_dataset() {
    echo -e "${PURPLE}📊 Large Dataset Generation${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Warning: This will generate a large number of users.${NC}"
    echo -e "${GRAY}   Recommended for performance testing and demos.${NC}"
    echo ""
    echo -e "${WHITE}Suggested counts:${NC}"
    echo -e "   • School Admins: 10-20"
    echo -e "   • Teachers: 100-200"
    echo -e "   • Students: 1000-5000"
    echo -e "   • Alumni: 500-2000"
    echo ""
    
    read -p "$(echo -e ${WHITE}Do you want to continue? [y/N]:${NC} )" confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        interactive_generation
    else
        echo -e "${YELLOW}🔙 Returning to main menu...${NC}"
        show_menu
    fi
}

# Custom configuration
custom_configuration() {
    echo -e "${CYAN}🛠️  Custom Configuration${NC}"
    echo ""
    echo -e "${WHITE}Available environment variables:${NC}"
    echo -e "   ${CYAN}DB_SKIP_VALIDATION=true${NC}  - Skip database connection check"
    echo -e "   ${CYAN}GENERATE_PREVIEW=false${NC}   - Skip preview mode"
    echo -e "   ${CYAN}OUTPUT_DIR=./data${NC}        - Custom output directory"
    echo ""
    
    read -p "$(echo -e ${WHITE}Set custom environment? [y/N]:${NC} )" custom_env
    
    if [[ $custom_env =~ ^[Yy]$ ]]; then
        echo ""
        read -p "$(echo -e ${WHITE}Enter custom output directory [./generated_data]:${NC} )" output_dir
        output_dir=${output_dir:-./generated_data}
        
        export OUTPUT_DIR="$output_dir"
        echo -e "${GREEN}✅ Custom output directory set: $output_dir${NC}"
    fi
    
    interactive_generation
}

# Show help and documentation
show_help() {
    echo -e "${WHITE}📚 HELP & DOCUMENTATION${NC}"
    echo -e "${GRAY}─────────────────────────────────────────────────────────────${NC}"
    echo ""
    echo -e "${CYAN}🎯 Purpose:${NC}"
    echo -e "   Generate realistic fake user data for testing the My School Buddies platform."
    echo ""
    echo -e "${CYAN}🎭 Supported Roles:${NC}"
    echo -e "   • ${WHITE}Platform Admin${NC}  - System administrators (typically 1)"
    echo -e "   • ${WHITE}School Admin${NC}    - School principals/administrators"
    echo -e "   • ${WHITE}Teacher${NC}         - Faculty members"
    echo -e "   • ${WHITE}Student${NC}         - Current students"
    echo -e "   • ${WHITE}Alumni${NC}          - Former students"
    echo ""
    echo -e "${CYAN}📊 Generated Data Includes:${NC}"
    echo -e "   • Realistic Indian names"
    echo -e "   • Valid email addresses"
    echo -e "   • Indian phone numbers (+91 format)"
    echo -e "   • Age-appropriate dates of birth"
    echo -e "   • Academic years (admission/graduation)"
    echo -e "   • School assignments"
    echo ""
    echo -e "${CYAN}📁 Output Formats:${NC}"
    echo -e "   • Combined CSV file with all users"
    echo -e "   • Separate CSV files per role (optional)"
    echo -e "   • Ready for import via ${WHITE}./scripts/import_data.sh${NC}"
    echo ""
    echo -e "${CYAN}🔧 Manual Usage:${NC}"
    echo -e "   ${WHITE}cd backend && npm run generate-users${NC}"
    echo ""
    echo -e "${CYAN}📖 More Information:${NC}"
    echo -e "   • Check ${WHITE}IMPORT_GUIDE.md${NC} for detailed instructions"
    echo -e "   • View CSV templates in ${WHITE}public/templates/${NC}"
    echo -e "   • Monitor imports with ${WHITE}./scripts/monitor-import.sh${NC}"
    echo ""
    
    read -p "$(echo -e ${WHITE}Press Enter to continue...${NC})"
    show_menu
}

# Main execution
main() {
    show_banner
    check_prerequisites
    show_menu
}

# Trap Ctrl+C to provide clean exit
trap 'echo -e "\n${YELLOW}🛑 User generation cancelled.${NC}"; exit 0' INT

# Run main function
main