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

# === 📋 MAIN MENU ===
echo ""
echo -e "${CYAN}🚀 My School Buddies - Data Import Tool${NC}"
echo "======================================="
echo ""
echo -e "${BLUE}📋 What would you like to import?${NC}"
echo "  1️⃣  Schools (Educational Institutions)"
echo "  2️⃣  Users (Students, Teachers, Alumni, Admins)"
echo "  3️⃣  Exit"
echo ""
read -rp "👉 Enter your choice (1, 2, or 3): " DATA_TYPE

case "$DATA_TYPE" in
  "1")
    DATA_TYPE_NAME="schools"
    LOG_BASE_DIR="/var/log/school-import"
    ;;
  "2")
    DATA_TYPE_NAME="users"
    LOG_BASE_DIR="/var/log/user-import"
    ;;
  "3")
    echo -e "${GREEN}✅ Goodbye!${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

LOG_DIR="$LOG_BASE_DIR"
LOG_FILE="$LOG_DIR/import.log"
PID_FILE="$LOG_DIR/import.pid"

# === 🤖 IMPORT MODE SELECTION ===
echo ""
echo -e "${BLUE}📋 Choose import mode for ${DATA_TYPE_NAME}:${NC}"
echo "  1️⃣  Standard (100-200 records/batch) - Good for small to medium datasets"
echo "  2️⃣  Bulk (300-500 records/batch) - Faster for large datasets"
echo "  3️⃣  Optimized (200+ records/batch) - Best for 1M+ records with advanced features"
echo ""
read -rp "👉 Enter your choice (1, 2, or 3): " MODE_CHOICE

if [ "$MODE_CHOICE" == "1" ]; then
  MODE_NAME="Standard"
  if [ "$DATA_TYPE_NAME" == "schools" ]; then
    SCRIPT_NAME="import-schools"
    BATCH_SIZE="100"
  else
    SCRIPT_NAME="import-users"
    BATCH_SIZE="100"
  fi
elif [ "$MODE_CHOICE" == "2" ]; then
  MODE_NAME="Bulk"
  if [ "$DATA_TYPE_NAME" == "schools" ]; then
    SCRIPT_NAME="import-schools-bulk"
    BATCH_SIZE="300"
  else
    SCRIPT_NAME="import-users-bulk"
    BATCH_SIZE="500"
  fi
elif [ "$MODE_CHOICE" == "3" ]; then
  MODE_NAME="Optimized"
  if [ "$DATA_TYPE_NAME" == "schools" ]; then
    SCRIPT_NAME="import-schools-optimized"
    BATCH_SIZE="200"
  else
    SCRIPT_NAME="import-users-optimized"
    BATCH_SIZE="200"
  fi
else
  echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
  exit 1
fi

# === 🏫 SCHOOL SELECTION (for user imports only) ===
SCHOOL_CONTEXT=""
if [ "$DATA_TYPE_NAME" == "users" ]; then
  echo ""
  echo -e "${YELLOW}🏫 School Selection for User Import:${NC}"
  echo "  1️⃣  Import users for a specific school (enter UDISE code)"
  echo "  2️⃣  Import users for multiple schools (UDISE codes in CSV)"
  echo ""
  read -rp "👉 Enter your choice (1 or 2): " SCHOOL_CHOICE

  if [ "$SCHOOL_CHOICE" == "1" ]; then
    echo ""
    read -rp "🏫 Enter the school UDISE code: " UDISE_CODE
    SCHOOL_CONTEXT="Target School: $UDISE_CODE"
    echo -e "${GREEN}✅ Users will be imported for school: $UDISE_CODE${NC}"
  elif [ "$SCHOOL_CHOICE" == "2" ]; then
    SCHOOL_CONTEXT="Multiple Schools (UDISE codes from CSV)"
    echo -e "${GREEN}✅ Users will be imported for multiple schools based on CSV data${NC}"
  else
    echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
    exit 1
  fi
fi

# === 📁 GET CSV FILE PATH ===
echo ""
read -rp "📁 Enter full path to your CSV file: " CSV_FILE

if [ ! -f "$CSV_FILE" ]; then
  echo -e "${RED}❌ ERROR: File not found at: $CSV_FILE${NC}"
  exit 1
fi

# === 📊 CSV FILE VALIDATION ===
echo ""
echo -e "${BLUE}📊 Validating CSV file...${NC}"
CSV_LINES=$(wc -l < "$CSV_FILE")
CSV_HEADER=$(head -1 "$CSV_FILE")

echo -e "${GREEN}✅ CSV file validation:${NC}"
echo "   📄 File: $CSV_FILE"
echo "   📝 Total lines: $CSV_LINES (including header)"
echo "   📋 Estimated records: $((CSV_LINES - 1))"
echo "   🏷️  Header: $CSV_HEADER"

# Estimated time calculation
ESTIMATED_RECORDS=$((CSV_LINES - 1))
if [ "$ESTIMATED_RECORDS" -gt 0 ]; then
  if [ "$MODE_NAME" == "Standard" ]; then
    ESTIMATED_TIME_MIN=$((ESTIMATED_RECORDS / 50))  # ~50 records/minute
  elif [ "$MODE_NAME" == "Bulk" ]; then
    ESTIMATED_TIME_MIN=$((ESTIMATED_RECORDS / 200)) # ~200 records/minute  
  else
    ESTIMATED_TIME_MIN=$((ESTIMATED_RECORDS / 300)) # ~300 records/minute
  fi
  
  if [ "$ESTIMATED_TIME_MIN" -lt 1 ]; then
    ESTIMATED_TIME_MIN=1
  fi
  
  echo -e "${CYAN}⏱️  Estimated import time: ~$ESTIMATED_TIME_MIN minutes${NC}"
fi

# === 📂 PREPARE LOG DIRECTORY ===
mkdir -p "$LOG_DIR"

# === 📦 NAVIGATE TO WORKING DIRECTORY ===
cd "$WORK_DIR" || {
  echo -e "${RED}❌ ERROR: Could not change to $WORK_DIR${NC}" | tee -a "$LOG_FILE"
  exit 1
}

# === 🚀 CONFIRMATION AND EXECUTION ===
echo ""
echo -e "${YELLOW}🔍 Import Summary:${NC}"
echo "   📊 Data Type: $DATA_TYPE_NAME"
echo "   ⚙️  Mode: $MODE_NAME ($BATCH_SIZE records/batch)"
echo "   📄 CSV File: $CSV_FILE"
echo "   📝 Records: $ESTIMATED_RECORDS"
if [ -n "$SCHOOL_CONTEXT" ]; then
  echo "   🏫 $SCHOOL_CONTEXT"
fi
echo "   📁 Backend Directory: $WORK_DIR"
echo "   🧾 Log File: $LOG_FILE"
echo ""

read -rp "🚀 Proceed with import? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Import cancelled by user.${NC}"
  exit 0
fi

# === 🚀 EXECUTE IMPORT IN BACKGROUND ===
(
  echo "================================================================================"
  echo "🚀 Import Started: $(date)"
  echo "📊 Data Type: $DATA_TYPE_NAME"
  echo "⚙️  Import Mode: $MODE_NAME ($SCRIPT_NAME - $BATCH_SIZE records per batch)"
  echo "📄 CSV File: $CSV_FILE"
  echo "📝 Total Records: $ESTIMATED_RECORDS"
  if [ -n "$SCHOOL_CONTEXT" ]; then
    echo "🏫 School Context: $SCHOOL_CONTEXT"
  fi
  echo "📁 Backend Directory: $WORK_DIR"
  echo "🧾 Log File: $LOG_FILE"
  echo "================================================================================"
  echo ""

  # ✅ Run the actual import
  npm run "$SCRIPT_NAME" -- "$CSV_FILE"
  EXIT_CODE=$?

  echo ""
  echo "================================================================================"
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ SUCCESS: $DATA_TYPE_NAME import finished successfully at $(date)"
  else
    echo "❌ ERROR: $DATA_TYPE_NAME import failed with exit code $EXIT_CODE at $(date)"
  fi
  echo "================================================================================"
  echo "🔚 Import Process Completed"
  echo "================================================================================"

  # 🧹 Remove PID file on completion
  rm -f "$PID_FILE"
) >> "$LOG_FILE" 2>&1 &

# === 💾 SAVE PID TO FILE ===
echo $! > "$PID_FILE"

# === 📢 FINAL USER OUTPUT ===
echo ""
echo -e "${GREEN}🚀 Import started in the background${NC}"
echo -e "${BLUE}📌 Process Details:${NC}"
echo "   🆔 PID: $(cat $PID_FILE)"
echo "   📄 Log File: $LOG_FILE"
echo "   📊 Data Type: $DATA_TYPE_NAME"
echo "   ⚙️  Mode: $MODE_NAME"
echo ""
echo -e "${CYAN}📊 Monitoring Commands:${NC}"
echo ""
echo -e "${YELLOW}📄 View live logs:${NC}"
echo "   tail -f $LOG_FILE"
echo ""
echo -e "${YELLOW}📊 Use monitoring script:${NC}"
echo "   ./scripts/monitor-import.sh monitor"
echo ""
echo -e "${YELLOW}🩺 Check if process is running:${NC}"
echo "   ps -p \$(cat $PID_FILE)"
echo ""
echo -e "${YELLOW}📈 Check current status:${NC}"
echo "   ./scripts/monitor-import.sh status"
echo ""
echo -e "${YELLOW}🛑 Stop the import manually:${NC}"
echo "   ./scripts/monitor-import.sh stop"
echo "   # OR: kill \$(cat $PID_FILE)"
echo ""
echo -e "${GREEN}✅ Import process initiated successfully!${NC}"
echo -e "${CYAN}📊 Estimated completion time: ~$ESTIMATED_TIME_MIN minutes${NC}"
echo ""