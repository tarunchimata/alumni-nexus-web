#!/bin/bash

################################################################################
# 📦 Script Name:    import_schools_interactive.sh
# 🧠 Purpose:        Import school data via CSV using either standard or bulk mode
#
# 🧾 Description:
#   - Interactive CLI tool to import school data from a CSV file.
#   - Supports two import modes: Standard (100 records/batch) or Bulk (1000/batch).
#   - Executes the import process in the background.
#   - Logs output and tracks PID for monitoring and troubleshooting.
#
# 📁 Requirements:
#   - Node.js and npm installed
#   - Backend repo with scripts in package.json:
#       "import-schools": "node scripts/importSchools.js"
#       "import-schools-bulk": "node scripts/importSchoolsBulk.js"
#   - PostgreSQL database set up and reachable
#   - Clean CSV file of school data
#
# 🚀 How to Use:
#   1. Make this script executable:
#        chmod +x import_schools_interactive.sh
#
#   2. Run it:
#        ./import_schools_interactive.sh
#
#   3. Choose import mode:
#        - 1 for 100 records per batch
#        - 2 for 1000 records per batch (for large datasets)
#
#   4. Provide the full path to your CSV file when prompted
#
# 📊 Monitoring and Troubleshooting:
#
#   ✅ View live logs:
#       tail -f /var/log/school-import/import.log
#
#   ✅ Check if the import process is still running:
#       ps -p $(cat /var/log/school-import/import.pid)
#
#   ❌ Stop the import manually:
#       kill $(cat /var/log/school-import/import.pid)
#
################################################################################

# === 🛠️ CONFIGURATION ===

WORK_DIR="/path/to/your/project/backend"      # 🔧 Change this to your backend folder
LOG_DIR="/var/log/school-import"              # 📂 Log storage directory
LOG_FILE="$LOG_DIR/import.log"                # 🧾 Output log file
PID_FILE="$LOG_DIR/import.pid"                # 🧠 PID tracking file

# === 🤖 IMPORT MODE SELECTION ===

echo "📋 Choose import mode:"
echo "  1️⃣  100 records per batch (Standard)"
echo "  2️⃣  1000 records per batch (Optimized for 1M+ records)"
read -rp "👉 Enter your choice (1 or 2): " CHOICE

if [ "$CHOICE" == "1" ]; then
  SCRIPT_NAME="import-schools"
  BATCH_SIZE="100"
elif [ "$CHOICE" == "2" ]; then
  SCRIPT_NAME="import-schools-bulk"
  BATCH_SIZE="1000"
else
  echo "❌ Invalid choice. Exiting."
  exit 1
fi

# === 📁 GET CSV FILE PATH ===

read -rp "📁 Enter full path to your CSV file: " CSV_FILE

if [ ! -f "$CSV_FILE" ]; then
  echo "❌ ERROR: File not found at: $CSV_FILE"
  exit 1
fi

# === 📂 PREPARE LOG DIRECTORY ===

mkdir -p "$LOG_DIR"

# === 📦 NAVIGATE TO WORKING DIRECTORY ===

cd "$WORK_DIR" || {
  echo "❌ ERROR: Could not change to $WORK_DIR" | tee -a "$LOG_FILE"
  exit 1
}

# === 🚀 EXECUTE IMPORT IN BACKGROUND ===

(
  echo "================================================================================"
  echo "📦 Import Started: $(date)"
  echo "📝 Import Mode: $SCRIPT_NAME ($BATCH_SIZE records per batch)"
  echo "📄 CSV File: $CSV_FILE"
  echo "📁 Backend Directory: $WORK_DIR"
  echo "🧾 Log File: $LOG_FILE"
  echo "================================================================================"

  # ✅ Run the actual import
  npm run "$SCRIPT_NAME" -- "$CSV_FILE"
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ SUCCESS: Import finished at $(date)"
  else
    echo "❌ ERROR: Import failed with exit code $EXIT_CODE at $(date)"
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
echo "🚀 Import started in the background"
echo "📌 PID: $(cat $PID_FILE)"
echo "📄 Log File: $LOG_FILE"
echo ""
echo "📊 To monitor logs live:"
echo "   tail -f $LOG_FILE"
echo ""
echo "🩺 To check if it's running:"
echo "   ps -p \$(cat $PID_FILE)"
echo ""
echo "🛑 To stop the import manually:"
echo "   kill \$(cat $PID_FILE)"
echo ""
