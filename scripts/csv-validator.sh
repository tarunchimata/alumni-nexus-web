#!/bin/bash

################################################################################
# 🔍 CSV File Validator for My School Buddies
# Advanced CSV validation with detailed feedback and error reporting
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
║        🔍 MY SCHOOL BUDDIES - CSV VALIDATOR 🔍              ║
║                                                              ║
║          📊 Validate CSV Files Before Import 📊             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if file path is provided
if [ $# -eq 0 ]; then
    echo ""
    echo -e "${BLUE}📁 Please provide the CSV file to validate:${NC}"
    echo ""
    read -rp "📄 Enter full path to your CSV file: " CSV_FILE
else
    CSV_FILE="$1"
fi

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
    echo ""
    echo -e "${RED}❌ ERROR: File not found!${NC}"
    echo -e "${RED}   Path: $CSV_FILE${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${CYAN}🔍 Starting CSV Validation${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

# Basic file information
echo ""
echo -e "${BLUE}📄 File Information:${NC}"
FILE_SIZE=$(du -h "$CSV_FILE" | cut -f1)
FILE_ENCODING=$(file -b --mime-encoding "$CSV_FILE")
LINE_COUNT=$(wc -l < "$CSV_FILE")
echo -e "   📁 File: ${CYAN}$(basename "$CSV_FILE")${NC}"
echo -e "   📏 Size: ${CYAN}$FILE_SIZE${NC}"
echo -e "   🔤 Encoding: ${CYAN}$FILE_ENCODING${NC}"
echo -e "   📝 Total Lines: ${CYAN}$LINE_COUNT${NC}"

# Header analysis
echo ""
echo -e "${BLUE}🏷️  Header Analysis:${NC}"
HEADER=$(head -1 "$CSV_FILE")
COLUMN_COUNT=$(echo "$HEADER" | tr ',' '\n' | wc -l)
echo -e "   📋 Columns: ${CYAN}$COLUMN_COUNT${NC}"
echo -e "   🏷️  Headers: ${YELLOW}$HEADER${NC}"

# Detect import type based on headers
echo ""
echo -e "${BLUE}🎯 Import Type Detection:${NC}"
if echo "$HEADER" | grep -q "udise_code\|school_type\|management_type"; then
    IMPORT_TYPE="🏫 Schools"
    echo -e "   ✅ Detected: ${GREEN}School Import${NC}"
    
    # Required fields for schools
    REQUIRED_FIELDS=("name" "udise_code" "school_type" "management_type" "address" "contact_number")
    
elif echo "$HEADER" | grep -q "email\|first_name\|last_name\|role"; then
    IMPORT_TYPE="👥 Users"
    echo -e "   ✅ Detected: ${GREEN}User Import${NC}"
    
    # Required fields for users
    REQUIRED_FIELDS=("email" "first_name" "last_name" "role" "school_udise_code")
    
else
    IMPORT_TYPE="❓ Unknown"
    echo -e "   ⚠️  Type: ${YELLOW}Unknown/Custom${NC}"
    REQUIRED_FIELDS=()
fi

# Field validation
if [ ${#REQUIRED_FIELDS[@]} -gt 0 ]; then
    echo ""
    echo -e "${BLUE}📋 Required Field Validation:${NC}"
    MISSING_FIELDS=()
    
    for field in "${REQUIRED_FIELDS[@]}"; do
        if echo "$HEADER" | grep -q "$field"; then
            echo -e "   ✅ ${GREEN}$field${NC}"
        else
            echo -e "   ❌ ${RED}$field (MISSING)${NC}"
            MISSING_FIELDS+=("$field")
        fi
    done
    
    if [ ${#MISSING_FIELDS[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Validation Failed: Missing required fields${NC}"
        echo -e "${YELLOW}💡 Missing fields: ${MISSING_FIELDS[*]}${NC}"
        exit 1
    fi
fi

# Data sampling and validation
echo ""
echo -e "${BLUE}🔬 Data Quality Analysis:${NC}"

# Sample first few data rows (skip header)
SAMPLE_SIZE=5
if [ $LINE_COUNT -gt 1 ]; then
    echo -e "   📊 Analyzing first $SAMPLE_SIZE data rows..."
    
    VALIDATION_ERRORS=()
    ROW_NUM=2 # Start from row 2 (first data row)
    
    tail -n +2 "$CSV_FILE" | head -n $SAMPLE_SIZE | while IFS= read -r line; do
        # Check for common issues
        if [ -z "$line" ]; then
            echo -e "   ⚠️  Row $ROW_NUM: Empty row detected"
        fi
        
        # Count columns in this row
        ROW_COLUMNS=$(echo "$line" | tr ',' '\n' | wc -l)
        if [ "$ROW_COLUMNS" -ne "$COLUMN_COUNT" ]; then
            echo -e "   ⚠️  Row $ROW_NUM: Column count mismatch ($ROW_COLUMNS vs $COLUMN_COUNT expected)"
        fi
        
        # Check for email format (if email column exists)
        if echo "$HEADER" | grep -q "email"; then
            EMAIL_COL=$(echo "$HEADER" | tr ',' '\n' | grep -n "email" | cut -d: -f1)
            EMAIL_VALUE=$(echo "$line" | cut -d',' -f$EMAIL_COL | tr -d '"')
            if ! echo "$EMAIL_VALUE" | grep -qE '^[^@]+@[^@]+\.[^@]+$'; then
                echo -e "   ⚠️  Row $ROW_NUM: Invalid email format: $EMAIL_VALUE"
            fi
        fi
        
        ROW_NUM=$((ROW_NUM + 1))
    done
    
else
    echo -e "   ${RED}❌ No data rows found (only header)${NC}"
fi

# Advanced statistics
echo ""
echo -e "${BLUE}📊 Advanced Statistics:${NC}"

# Check for duplicates in first column (usually ID or email)
FIRST_COL_FIELD=$(echo "$HEADER" | cut -d',' -f1)
FIRST_COL_VALUES=$(tail -n +2 "$CSV_FILE" | cut -d',' -f1 | sort | uniq -c | sort -nr)
DUPLICATE_COUNT=$(echo "$FIRST_COL_VALUES" | awk '$1 > 1' | wc -l)

echo -e "   🔍 Checking duplicates in '$FIRST_COL_FIELD' column..."
if [ "$DUPLICATE_COUNT" -gt 0 ]; then
    echo -e "   ⚠️  Found ${YELLOW}$DUPLICATE_COUNT${NC} potential duplicates"
    echo -e "   📋 Top duplicates:"
    echo "$FIRST_COL_VALUES" | awk '$1 > 1' | head -3 | while read count value; do
        echo -e "      ${RED}$value${NC} (appears $count times)"
    done
else
    echo -e "   ✅ No duplicates found in '$FIRST_COL_FIELD'"
fi

# Character encoding validation
echo ""
echo -e "${BLUE}🔤 Character Encoding Validation:${NC}"
if [ "$FILE_ENCODING" = "utf-8" ] || [ "$FILE_ENCODING" = "us-ascii" ]; then
    echo -e "   ✅ Encoding is compatible: ${GREEN}$FILE_ENCODING${NC}"
else
    echo -e "   ⚠️  Encoding might cause issues: ${YELLOW}$FILE_ENCODING${NC}"
    echo -e "   💡 Recommended: Convert to UTF-8"
    echo -e "      ${CYAN}iconv -f $FILE_ENCODING -t UTF-8 \"$CSV_FILE\" > utf8_file.csv${NC}"
fi

# Performance estimation
echo ""
echo -e "${BLUE}⚡ Performance Estimation:${NC}"
DATA_ROWS=$((LINE_COUNT - 1))
if [ "$DATA_ROWS" -gt 0 ]; then
    # Estimate based on record count
    if [ "$DATA_ROWS" -lt 1000 ]; then
        MODE_SUGGESTION="Standard Mode (100 records/batch)"
        TIME_ESTIMATE="5-15 minutes"
        PERFORMANCE_COLOR="$GREEN"
    elif [ "$DATA_ROWS" -lt 50000 ]; then
        MODE_SUGGESTION="Bulk Mode (300-500 records/batch)"
        TIME_ESTIMATE="30 minutes - 2 hours"
        PERFORMANCE_COLOR="$YELLOW"
    else
        MODE_SUGGESTION="Optimized Mode (200+ records/batch)"
        TIME_ESTIMATE="2+ hours"
        PERFORMANCE_COLOR="$RED"
    fi
    
    echo -e "   📊 Data Rows: ${CYAN}$DATA_ROWS${NC}"
    echo -e "   🚀 Recommended: ${PERFORMANCE_COLOR}$MODE_SUGGESTION${NC}"
    echo -e "   ⏱️  Estimated Time: ${PERFORMANCE_COLOR}$TIME_ESTIMATE${NC}"
fi

# Final validation result
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

if [ ${#MISSING_FIELDS[@]} -eq 0 ] && [ "$FILE_ENCODING" = "utf-8" -o "$FILE_ENCODING" = "us-ascii" ]; then
    echo -e "${GREEN}✅ CSV VALIDATION PASSED!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your CSV file is ready for import!${NC}"
    echo -e "${BLUE}📋 Import Type: $IMPORT_TYPE${NC}"
    echo -e "${BLUE}📊 Records: $DATA_ROWS${NC}"
    echo ""
    echo -e "${CYAN}🚀 To start import:${NC}"
    echo -e "   ${YELLOW}./scripts/import_data.sh${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  CSV VALIDATION COMPLETED WITH WARNINGS${NC}"
    echo ""
    echo -e "${YELLOW}Your file can be imported but may have issues.${NC}"
    echo -e "${BLUE}Please review the warnings above before proceeding.${NC}"
    echo ""
fi

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🌟 Thank you for using My School Buddies CSV Validator! 🌟${NC}"
echo ""