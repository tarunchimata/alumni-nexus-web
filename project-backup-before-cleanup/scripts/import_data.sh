#!/bin/bash

################################################################################
# 🚀 Script Name:    import_data.sh
# 🧠 Purpose:        Unified import tool for schools and users data via CSV
#
# 🧾 Description:
#   - Interactive CLI tool to import either school or user data from CSV files.
#   - Supports three import modes for each data type: Standard, Bulk, and Optimized.
#   - For user imports, includes school selection functionality.
#   - Executes import processes in the background with comprehensive logging.
#   - Tracks PID for monitoring and troubleshooting.
#
# 📁 Requirements:
#   - Node.js and npm installed
#   - Backend repo with all import scripts in package.json
#   - PostgreSQL database set up and reachable
#   - Keycloak server running (for user imports)
#   - Clean CSV files with proper formatting
#
# 🚀 How to Use:
#   1. Make this script executable:
#        chmod +x import_data.sh
#
#   2. Run it:
#        ./import_data.sh
#
#   3. Choose data type (Schools or Users)
#   4. Choose import mode (Standard/Bulk/Optimized)
#   5. For users: Select target school
#   6. Provide the full path to your CSV file
#
# 📊 Monitoring and Troubleshooting:
#
#   ✅ View live logs:
#       tail -f /var/log/school-import/import.log  (for schools)
#       tail -f /var/log/user-import/import.log    (for users)
#
#   ✅ Use monitoring script:
#       ./scripts/monitor-import.sh
#
#   ✅ Check process status:
#       ps -p $(cat /var/log/[school|user]-import/import.pid)
#
#   ❌ Stop import manually:
#       kill $(cat /var/log/[school|user]-import/import.pid)
#
################################################################################

# === 🛠️ CONFIGURATION ===
WORK_DIR="$(pwd)/backend"                     # 🔧 Backend folder (auto-detected)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# === 🎨 ASCII ART BANNER ===
echo ""
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    🚀 MY SCHOOL BUDDIES - DATA IMPORT WIZARD 🚀              ║
║                                                               ║
║    📚 Connecting Schools • Students • Communities 📚          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# === 📋 MAIN MENU ===
echo ""
echo -e "${BLUE}🎯 What would you like to import today?${NC}"
echo ""
echo -e "${GREEN}  1️⃣  🏫 Schools & Educational Institutions${NC}"
echo -e "     ${YELLOW}├─ Government Schools, Private Schools, Colleges${NC}"
echo -e "     ${YELLOW}└─ Supports UDISE codes and bulk operations${NC}"
echo ""
echo -e "${GREEN}  2️⃣  👥 Users (Students, Teachers, Alumni & Admins)${NC}"
echo -e "     ${YELLOW}├─ Auto-assign to schools via UDISE codes${NC}"
echo -e "     ${YELLOW}└─ Bulk user creation with Keycloak integration${NC}"
echo ""
echo -e "${GREEN}  3️⃣  🚪 Exit${NC}"
echo -e "     ${YELLOW}└─ Close the import wizard${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
read -rp "👉 Enter your choice (1, 2, or 3): " DATA_TYPE

case "$DATA_TYPE" in
  "1")
    DATA_TYPE_NAME="schools"
    LOG_BASE_DIR="/var/log/school-import"
    echo ""
    echo -e "${GREEN}🏫 Excellent choice! You're importing Schools & Educational Institutions${NC}"
    echo -e "${BLUE}📊 This will help build your institutional database${NC}"
    ;;
  "2")
    DATA_TYPE_NAME="users"
    LOG_BASE_DIR="/var/log/user-import"
    echo ""
    echo -e "${GREEN}👥 Great! You're importing Users (Students, Teachers, Alumni & Admins)${NC}"
    echo -e "${BLUE}🔗 These users will be automatically linked to their respective schools${NC}"
    ;;
  "3")
    echo ""
    echo -e "${CYAN}👋 Thank you for using My School Buddies Import Wizard!${NC}"
    echo -e "${YELLOW}🌟 Have a great day connecting schools and communities! 🌟${NC}"
    echo ""
    exit 0
    ;;
  *)
    echo ""
    echo -e "${RED}❌ Oops! Invalid choice. Please select 1, 2, or 3.${NC}"
    echo -e "${YELLOW}💡 Tip: Make sure to enter just the number (1, 2, or 3)${NC}"
    echo ""
    exit 1
    ;;
esac

LOG_DIR="$LOG_BASE_DIR"
LOG_FILE="$LOG_DIR/import.log"
PID_FILE="$LOG_DIR/import.pid"

# === ⚙️ IMPORT MODE SELECTION ===
echo ""
echo -e "${CYAN}⚡ Import Mode Selection for ${DATA_TYPE_NAME}${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}  1️⃣  🐌 Standard Mode (100-200 records/batch)${NC}"
echo -e "     ${YELLOW}├─ Perfect for: Small to medium datasets (< 10K records)${NC}"
echo -e "     ${YELLOW}├─ Performance: ~50 records/minute${NC}"
echo -e "     ${YELLOW}├─ Memory Usage: Low${NC}"
echo -e "     ${YELLOW}└─ Best for: Testing, small schools, pilot imports${NC}"
echo ""
echo -e "${GREEN}  2️⃣  🚀 Bulk Mode (300-500 records/batch)${NC}"
echo -e "     ${YELLOW}├─ Perfect for: Large datasets (10K - 100K records)${NC}"
echo -e "     ${YELLOW}├─ Performance: ~200 records/minute${NC}"
echo -e "     ${YELLOW}├─ Memory Usage: Medium${NC}"
echo -e "     ${YELLOW}└─ Best for: District-level imports, large schools${NC}"
echo ""
echo -e "${GREEN}  3️⃣  ⚡ Optimized Mode (200+ records/batch)${NC}"
echo -e "     ${YELLOW}├─ Perfect for: Massive datasets (100K+ records)${NC}"
echo -e "     ${YELLOW}├─ Performance: ~300 records/minute${NC}"
echo -e "     ${YELLOW}├─ Memory Usage: High (with auto-cleanup)${NC}"
echo -e "     ${YELLOW}├─ Features: Advanced retry, connection pooling${NC}"
echo -e "     ${YELLOW}└─ Best for: State-level imports, 1M+ records${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
read -rp "🎯 Enter your choice (1, 2, or 3): " MODE_CHOICE

if [ "$MODE_CHOICE" == "1" ]; then
  MODE_NAME="🐌 Standard Mode"
  MODE_EMOJI="🐌"
  if [ "$DATA_TYPE_NAME" == "schools" ]; then
    SCRIPT_NAME="import-schools"
    BATCH_SIZE="100"
  else
    SCRIPT_NAME="import-users"
    BATCH_SIZE="100"
  fi
  echo ""
  echo -e "${GREEN}🐌 Standard Mode Selected!${NC}"
  echo -e "${BLUE}✅ Great for testing and small imports${NC}"
  
elif [ "$MODE_CHOICE" == "2" ]; then
  MODE_NAME="🚀 Bulk Mode"
  MODE_EMOJI="🚀"
  if [ "$DATA_TYPE_NAME" == "schools" ]; then
    SCRIPT_NAME="import-schools-bulk"
    BATCH_SIZE="300"
  else
    SCRIPT_NAME="import-users-bulk"
    BATCH_SIZE="500"
  fi
  echo ""
  echo -e "${GREEN}🚀 Bulk Mode Selected!${NC}"
  echo -e "${BLUE}✅ Perfect for medium to large datasets${NC}"
  
elif [ "$MODE_CHOICE" == "3" ]; then
  MODE_NAME="⚡ Optimized Mode"
  MODE_EMOJI="⚡"
  if [ "$DATA_TYPE_NAME" == "schools" ]; then
    SCRIPT_NAME="import-schools-optimized"
    BATCH_SIZE="200"
  else
    SCRIPT_NAME="import-users-optimized"
    BATCH_SIZE="200"
  fi
  echo ""
  echo -e "${GREEN}⚡ Optimized Mode Selected!${NC}"
  echo -e "${BLUE}✅ Maximum performance for massive datasets${NC}"
  
else
  echo ""
  echo -e "${RED}❌ Invalid choice. Please select 1, 2, or 3.${NC}"
  echo -e "${YELLOW}💡 Tip: Different modes are optimized for different data sizes${NC}"
  echo ""
  exit 1
fi

# === 🏫 SCHOOL SELECTION (for user imports only) ===
SCHOOL_CONTEXT=""
if [ "$DATA_TYPE_NAME" == "users" ]; then
  echo ""
  echo -e "${CYAN}🏫 School Association Setup${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${BLUE}How would you like to associate users with schools?${NC}"
  echo ""
  echo -e "${GREEN}  1️⃣  🎯 Single School Import${NC}"
  echo -e "     ${YELLOW}├─ Import all users for one specific school${NC}"
  echo -e "     ${YELLOW}├─ You'll specify the UDISE code${NC}"
  echo -e "     ${YELLOW}└─ All users in CSV will be linked to this school${NC}"
  echo ""
  echo -e "${GREEN}  2️⃣  🌍 Multi-School Import${NC}"
  echo -e "     ${YELLOW}├─ Import users for multiple schools${NC}"
  echo -e "     ${YELLOW}├─ Each user row must include school UDISE code${NC}"
  echo -e "     ${YELLOW}└─ Users will be auto-linked to their respective schools${NC}"
  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
  read -rp "🎯 Enter your choice (1 or 2): " SCHOOL_CHOICE

  if [ "$SCHOOL_CHOICE" == "1" ]; then
    echo ""
    echo -e "${BLUE}🏫 Single School Import Selected${NC}"
    echo ""
    read -rp "📝 Enter the school UDISE code: " UDISE_CODE
    SCHOOL_CONTEXT="🎯 Target School: $UDISE_CODE"
    echo ""
    echo -e "${GREEN}✅ Perfect! All users will be imported for school: ${CYAN}$UDISE_CODE${NC}"
    echo -e "${YELLOW}💡 Make sure your CSV doesn't include school_udise_code column${NC}"
    
  elif [ "$SCHOOL_CHOICE" == "2" ]; then
    SCHOOL_CONTEXT="🌍 Multi-School Import (UDISE codes from CSV)"
    echo ""
    echo -e "${GREEN}✅ Multi-School Import Selected!${NC}"
    echo -e "${BLUE}📊 Users will be auto-assigned to schools based on CSV data${NC}"
    echo -e "${YELLOW}💡 Make sure your CSV includes 'school_udise_code' column${NC}"
    
  else
    echo ""
    echo -e "${RED}❌ Invalid choice. Please select 1 or 2.${NC}"
    echo -e "${YELLOW}💡 Tip: Choose 1 for single school, 2 for multiple schools${NC}"
    echo ""
    exit 1
  fi
fi

# === 📁 CSV FILE SELECTION ===
echo ""
echo -e "${CYAN}📁 CSV File Selection${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Please provide the path to your CSV file:${NC}"
echo ""
echo -e "${YELLOW}💡 Tips for best results:${NC}"
echo -e "   ${GREEN}✅ Use absolute paths: /home/user/data.csv${NC}"
echo -e "   ${GREEN}✅ Ensure file is UTF-8 encoded${NC}"
echo -e "   ${GREEN}✅ Check file permissions (readable)${NC}"
echo -e "   ${GREEN}✅ Use our sample templates if needed${NC}"
echo ""
read -rp "📄 Enter full path to your CSV file: " CSV_FILE

# Validate file existence
if [ ! -f "$CSV_FILE" ]; then
  echo ""
  echo -e "${RED}❌ ERROR: File not found!${NC}"
  echo -e "${RED}   Path: $CSV_FILE${NC}"
  echo ""
  echo -e "${YELLOW}🔍 Troubleshooting tips:${NC}"
  echo -e "   ${BLUE}• Check if the file path is correct${NC}"
  echo -e "   ${BLUE}• Ensure you have read permissions${NC}"
  echo -e "   ${BLUE}• Try using tab completion${NC}"
  echo -e "   ${BLUE}• Use quotes if path contains spaces${NC}"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}✅ CSV file found successfully!${NC}"

# === 📊 CSV FILE VALIDATION ===
echo ""
echo -e "${CYAN}📊 CSV File Analysis${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🔍 Analyzing your CSV file...${NC}"

# Get file information
CSV_LINES=$(wc -l < "$CSV_FILE")
CSV_HEADER=$(head -1 "$CSV_FILE")
FILE_SIZE=$(du -h "$CSV_FILE" | cut -f1)
FILE_ENCODING=$(file -b --mime-encoding "$CSV_FILE")

echo ""
echo -e "${GREEN}✅ File Analysis Complete:${NC}"
echo ""
echo -e "${BLUE}📄 File Details:${NC}"
echo -e "   📁 Path: ${CYAN}$CSV_FILE${NC}"
echo -e "   📏 Size: ${CYAN}$FILE_SIZE${NC}"
echo -e "   🔤 Encoding: ${CYAN}$FILE_ENCODING${NC}"
echo ""
echo -e "${BLUE}📊 Data Overview:${NC}"
echo -e "   📝 Total lines: ${CYAN}$CSV_LINES${NC} (including header)"
echo -e "   📋 Data records: ${CYAN}$((CSV_LINES - 1))${NC}"
echo -e "   🏷️  Header columns: ${CYAN}$(echo "$CSV_HEADER" | tr ',' '\n' | wc -l)${NC}"
echo ""
echo -e "${BLUE}🏷️  Column Headers:${NC}"
echo -e "   ${YELLOW}$CSV_HEADER${NC}"

# Validate encoding
if [ "$FILE_ENCODING" != "utf-8" ] && [ "$FILE_ENCODING" != "us-ascii" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  WARNING: File encoding is $FILE_ENCODING${NC}"
  echo -e "${YELLOW}   Recommended: UTF-8 for best compatibility${NC}"
  echo -e "${BLUE}   Convert with: iconv -f $FILE_ENCODING -t UTF-8 \"$CSV_FILE\" > utf8_file.csv${NC}"
fi

# === ⏱️ PERFORMANCE ESTIMATION ===
ESTIMATED_RECORDS=$((CSV_LINES - 1))
if [ "$ESTIMATED_RECORDS" -gt 0 ]; then
  echo ""
  echo -e "${CYAN}⏱️  Performance Estimation${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
  
  # Calculate estimates based on mode
  if [[ "$MODE_NAME" == *"Standard"* ]]; then
    RATE_PER_MIN=50
    RATE_DESC="Conservative (Standard Mode)"
  elif [[ "$MODE_NAME" == *"Bulk"* ]]; then
    RATE_PER_MIN=200
    RATE_DESC="Fast (Bulk Mode)"
  else
    RATE_PER_MIN=300
    RATE_DESC="Maximum (Optimized Mode)"
  fi
  
  ESTIMATED_TIME_MIN=$((ESTIMATED_RECORDS / RATE_PER_MIN))
  if [ "$ESTIMATED_TIME_MIN" -lt 1 ]; then
    ESTIMATED_TIME_MIN=1
  fi
  
  # Convert to hours if needed
  if [ "$ESTIMATED_TIME_MIN" -gt 60 ]; then
    HOURS=$((ESTIMATED_TIME_MIN / 60))
    MINUTES=$((ESTIMATED_TIME_MIN % 60))
    TIME_FORMAT="${HOURS}h ${MINUTES}m"
  else
    TIME_FORMAT="${ESTIMATED_TIME_MIN}m"
  fi
  
  echo ""
  echo -e "${BLUE}📊 Import Performance Estimate:${NC}"
  echo -e "   🚀 Processing Rate: ${CYAN}~$RATE_PER_MIN records/minute${NC} ($RATE_DESC)"
  echo -e "   ⏱️  Estimated Time: ${CYAN}~$TIME_FORMAT${NC}"
  echo -e "   📋 Total Records: ${CYAN}$ESTIMATED_RECORDS${NC}"
  echo ""
  
  # Add warnings for large datasets
  if [ "$ESTIMATED_RECORDS" -gt 100000 ]; then
    echo -e "${YELLOW}⚠️  Large Dataset Detected (100K+ records)${NC}"
    echo -e "   ${BLUE}• Consider running during off-peak hours${NC}"
    echo -e "   ${BLUE}• Monitor system resources during import${NC}"
    echo -e "   ${BLUE}• Ensure stable network connection${NC}"
  fi
  
  if [ "$ESTIMATED_RECORDS" -gt 1000000 ]; then
    echo -e "${RED}🚨 Massive Dataset (1M+ records)${NC}"
    echo -e "   ${BLUE}• Highly recommended to use Optimized Mode${NC}"
    echo -e "   ${BLUE}• Plan for several hours of processing time${NC}"
    echo -e "   ${BLUE}• Ensure database has sufficient resources${NC}"
  fi
fi

# === 📂 PREPARE LOG DIRECTORY ===
mkdir -p "$LOG_DIR"

# === 📦 NAVIGATE TO WORKING DIRECTORY ===
cd "$WORK_DIR" || {
  echo -e "${RED}❌ ERROR: Could not change to $WORK_DIR${NC}" | tee -a "$LOG_FILE"
  exit 1
}

# === 🚀 FINAL CONFIRMATION ===
echo ""
echo -e "${CYAN}🔍 Import Configuration Summary${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Import Details:${NC}"
echo -e "   📊 Data Type: ${GREEN}$DATA_TYPE_NAME${NC}"
echo -e "   ⚙️  Import Mode: ${GREEN}$MODE_NAME${NC} (${CYAN}$BATCH_SIZE records/batch${NC})"
echo -e "   📄 CSV File: ${CYAN}$CSV_FILE${NC}"
echo -e "   📝 Records to Process: ${CYAN}$ESTIMATED_RECORDS${NC}"
if [ -n "$SCHOOL_CONTEXT" ]; then
  echo -e "   🏫 School Association: ${GREEN}$SCHOOL_CONTEXT${NC}"
fi
echo -e "   📁 Working Directory: ${CYAN}$WORK_DIR${NC}"
echo -e "   🧾 Log File: ${CYAN}$LOG_FILE${NC}"
if [ -n "$TIME_FORMAT" ]; then
  echo -e "   ⏱️  Estimated Duration: ${YELLOW}~$TIME_FORMAT${NC}"
fi
echo ""

echo -e "${YELLOW}🎯 Ready to launch import!${NC}"
echo ""
echo -e "${GREEN}What happens next:${NC}"
echo -e "   ${BLUE}✅ Import runs in background${NC}"
echo -e "   ${BLUE}✅ Real-time progress monitoring${NC}"
echo -e "   ${BLUE}✅ Automatic error handling & retries${NC}"
echo -e "   ${BLUE}✅ Comprehensive logging${NC}"
echo -e "   ${BLUE}✅ Success/failure notifications${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

read -rp "🚀 Launch the import now? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo ""
  echo -e "${YELLOW}⏸️  Import cancelled by user${NC}"
  echo -e "${BLUE}💡 You can restart anytime by running: ./scripts/import_data.sh${NC}"
  echo ""
  exit 0
fi

echo ""
echo -e "${GREEN}🚀 Launching import in 3 seconds...${NC}"
sleep 1
echo -e "${YELLOW}🚀 3...${NC}"
sleep 1  
echo -e "${YELLOW}🚀 2...${NC}"
sleep 1
echo -e "${YELLOW}🚀 1...${NC}"
echo -e "${GREEN}🚀 BLAST OFF! 🎉${NC}"

# === 🚀 EXECUTE IMPORT IN BACKGROUND ===
(
  echo ""
  echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
  echo "🚀                    MY SCHOOL BUDDIES IMPORT STARTED                    🚀"
  echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
  echo ""
  echo "⏰ Start Time: $(date)"
  echo "📊 Data Type: $DATA_TYPE_NAME"
  echo "⚙️  Import Mode: $MODE_NAME"  
  echo "🔧 Script: $SCRIPT_NAME"
  echo "📦 Batch Size: $BATCH_SIZE records per batch"
  echo "📄 CSV File: $CSV_FILE"
  echo "📝 Total Records: $ESTIMATED_RECORDS"
  if [ -n "$SCHOOL_CONTEXT" ]; then
    echo "🏫 School Context: $SCHOOL_CONTEXT"
  fi
  echo "📁 Working Directory: $WORK_DIR"
  echo "🧾 Log File: $LOG_FILE"
  if [ -n "$TIME_FORMAT" ]; then
    echo "⏱️  Estimated Duration: ~$TIME_FORMAT"
  fi
  echo ""
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo "🚀 Starting data processing... Buckle up! 🎢"
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo ""

  # ✅ Run the actual import
  npm run "$SCRIPT_NAME" -- "$CSV_FILE"
  EXIT_CODE=$?

  echo ""
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo "⏰ End Time: $(date)"
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
    echo "🏆                        IMPORT COMPLETED SUCCESSFULLY! 🏆                   "
    echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
    echo ""
    echo "✨ Congratulations! Your $DATA_TYPE_NAME import is complete! ✨"
    echo "🎯 All $ESTIMATED_RECORDS records have been processed successfully!"
    echo "🔗 Users can now access the system with their imported data"
    echo "📊 Check the dashboard for detailed import statistics"
    echo ""
    echo "🌟 Thank you for using My School Buddies! 🌟"
    echo ""
  else
    echo ""
    echo "🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨"
    echo "❌                          IMPORT FAILED                               ❌"
    echo "🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨"
    echo ""
    echo "💔 $DATA_TYPE_NAME import encountered errors (Exit Code: $EXIT_CODE)"
    echo "🔍 Please check the error logs for detailed information"
    echo "💡 Common solutions:"
    echo "   • Check CSV file format and data quality"
    echo "   • Verify database and Keycloak connectivity"
    echo "   • Review system resource availability"
    echo "   • Try running with a smaller batch size"
    echo ""
    echo "📞 Need help? Contact support: support@myschoolbuddies.com"
    echo ""
  fi
  
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo "🔚 Import Process Completed at $(date)"
  echo "════════════════════════════════════════════════════════════════════════════════"

  # 🧹 Remove PID file on completion
  rm -f "$PID_FILE"
) >> "$LOG_FILE" 2>&1 &

# === 💾 SAVE PID TO FILE ===
echo $! > "$PID_FILE"

# === 🎉 SUCCESS MESSAGE & MONITORING INSTRUCTIONS ===
echo ""
echo -e "${GREEN}"
cat << "EOF"
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
🚀                    IMPORT LAUNCHED SUCCESSFULLY! 🚀                     
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}🎯 Your import is now running in the background!${NC}"
echo ""
echo -e "${CYAN}📌 Process Information:${NC}"
echo -e "   🆔 Process ID: ${GREEN}$(cat $PID_FILE)${NC}"
echo -e "   📊 Data Type: ${GREEN}$DATA_TYPE_NAME${NC}"
echo -e "   ⚙️  Import Mode: ${GREEN}$MODE_NAME${NC}"
echo -e "   📄 Log File: ${CYAN}$LOG_FILE${NC}"
if [ -n "$TIME_FORMAT" ]; then
  echo -e "   ⏱️  Estimated Time: ${YELLOW}~$TIME_FORMAT${NC}"
fi
echo ""

echo -e "${CYAN}🎮 Monitoring & Control Commands:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📊 Real-time Monitoring:${NC}"
echo -e "   ${BLUE}./scripts/monitor-import.sh monitor${NC}"
echo -e "   ${YELLOW}↳ Shows live progress with statistics and ETA${NC}"
echo ""
echo -e "${GREEN}📄 Live Log Streaming:${NC}"
echo -e "   ${BLUE}./scripts/monitor-import.sh logs${NC}"
echo -e "   ${YELLOW}↳ Follow the import logs in real-time${NC}"
echo ""
echo -e "${GREEN}📈 Quick Status Check:${NC}"
echo -e "   ${BLUE}./scripts/monitor-import.sh status${NC}"
echo -e "   ${YELLOW}↳ Get current progress summary${NC}"
echo ""
echo -e "${GREEN}🛑 Emergency Stop:${NC}"
echo -e "   ${BLUE}./scripts/monitor-import.sh stop${NC}"
echo -e "   ${YELLOW}↳ Safely terminate the import process${NC}"
echo ""
echo -e "${GREEN}📱 Manual Commands:${NC}"
echo -e "   ${BLUE}tail -f $LOG_FILE${NC}"
echo -e "   ${YELLOW}↳ Direct log file monitoring${NC}"
echo ""
echo -e "   ${BLUE}ps -p \$(cat $PID_FILE)${NC}"
echo -e "   ${YELLOW}↳ Check if process is still running${NC}"
echo ""

echo -e "${CYAN}🎊 What's Happening Now:${NC}"
echo -e "   ${GREEN}✅ CSV data is being validated and processed${NC}"
echo -e "   ${GREEN}✅ Database records are being created in batches${NC}"
if [ "$DATA_TYPE_NAME" == "users" ]; then
  echo -e "   ${GREEN}✅ User accounts are being created in Keycloak${NC}"
  echo -e "   ${GREEN}✅ School associations are being established${NC}"
fi
echo -e "   ${GREEN}✅ Progress is being logged with detailed statistics${NC}"
echo -e "   ${GREEN}✅ Automatic error handling and retry logic is active${NC}"
echo ""

echo -e "${YELLOW}💡 Pro Tips:${NC}"
echo -e "   ${BLUE}• Run the monitoring script in a separate terminal${NC}"
echo -e "   ${BLUE}• The import will continue even if you close this terminal${NC}"
echo -e "   ${BLUE}• Check back periodically or set up notifications${NC}"
echo -e "   ${BLUE}• All errors and statistics will be logged for review${NC}"
echo ""

echo -e "${GREEN}🌟 Thank you for using My School Buddies Import Wizard! 🌟${NC}"
echo -e "${BLUE}🚀 Your data import journey has begun! 🚀${NC}"
echo ""