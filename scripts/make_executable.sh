#!/bin/bash

################################################################################
# 🔧 Make All Import Scripts Executable
# Sets proper permissions for all My School Buddies import and utility scripts
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║      🔧 MY SCHOOL BUDDIES - SCRIPT PERMISSIONS 🔧           ║
║                                                              ║
║           🚀 Making All Scripts Executable 🚀               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}🔧 Setting executable permissions for all scripts...${NC}"
echo ""

# List of scripts to make executable
SCRIPTS=(
    "scripts/import_data.sh"
    "scripts/monitor-import.sh"
    "scripts/csv-validator.sh"
    "scripts/template-generator.sh"
    "scripts/make_executable.sh"
)

# Make scripts executable
SUCCESS_COUNT=0
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $script${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "${RED}❌ Failed to set permissions for $script${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $script (not found)${NC}"
    fi
done

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

if [ $SUCCESS_COUNT -eq ${#SCRIPTS[@]} ]; then
    echo -e "${GREEN}🎉 All scripts are now executable!${NC}"
else
    echo -e "${YELLOW}⚠️  $SUCCESS_COUNT out of ${#SCRIPTS[@]} scripts made executable${NC}"
fi

echo ""
echo -e "${BLUE}📋 Available Commands:${NC}"
echo ""
echo -e "${GREEN}🚀 Data Import:${NC}"
echo -e "   ${CYAN}./scripts/import_data.sh${NC}       - Interactive import wizard"
echo ""
echo -e "${GREEN}📊 Monitoring:${NC}"
echo -e "   ${CYAN}./scripts/monitor-import.sh${NC}    - Real-time import monitoring"
echo ""
echo -e "${GREEN}🔍 Validation:${NC}"
echo -e "   ${CYAN}./scripts/csv-validator.sh${NC}     - CSV file validation"
echo ""
echo -e "${GREEN}🎨 Templates:${NC}"
echo -e "   ${CYAN}./scripts/template-generator.sh${NC} - Create CSV templates"
echo ""

echo -e "${GREEN}🌟 Scripts are ready to use! Happy importing! 🌟${NC}"
echo ""