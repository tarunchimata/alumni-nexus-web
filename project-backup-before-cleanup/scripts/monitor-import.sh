#!/bin/bash

################################################################################
# 🎮 Enhanced Import Monitoring Script 
# Real-time monitoring for My School Buddies data import operations
# Supports both school and user imports with colorful, detailed feedback
################################################################################

# Auto-detect import type and set paths
if [ -f "/var/log/user-import/import.pid" ]; then
    LOG_DIR="/var/log/user-import"
    IMPORT_TYPE="👥 Users"
    IMPORT_EMOJI="👥"
elif [ -f "/var/log/school-import/import.pid" ]; then
    LOG_DIR="/var/log/school-import"
    IMPORT_TYPE="🏫 Schools"  
    IMPORT_EMOJI="🏫"
else
    # Default to school import for backward compatibility
    LOG_DIR="/var/log/school-import"
    IMPORT_TYPE="🏫 Schools"
    IMPORT_EMOJI="🏫"
fi

LOG_FILE="$LOG_DIR/import.log"
PID_FILE="$LOG_DIR/import.pid"

# Enhanced colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ASCII Art Header
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🎮 MY SCHOOL BUDDIES - IMPORT MONITOR 🎮            ║
║                                                              ║
║            📊 Real-time Import Tracking 📊                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BOLD}${BLUE}🔍 Monitoring: ${IMPORT_TYPE} Import${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

# Check if import is running
echo ""
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Import Process Status: ${BOLD}RUNNING${NC}"
        echo -e "${BLUE}   🆔 Process ID: ${CYAN}$PID${NC}"
        echo -e "${BLUE}   📁 Log Directory: ${CYAN}$LOG_DIR${NC}"
        echo -e "${BLUE}   📄 Log File: ${CYAN}$LOG_FILE${NC}"
        
        # Get process info
        PROCESS_INFO=$(ps -p "$PID" -o pid,ppid,user,%cpu,%mem,time,cmd --no-headers)
        if [ -n "$PROCESS_INFO" ]; then
            echo -e "${BLUE}   💻 Process Info: ${CYAN}$PROCESS_INFO${NC}"
        fi
        
        # Get log file size and age
        if [ -f "$LOG_FILE" ]; then
            LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
            LOG_MODIFIED=$(stat -c %y "$LOG_FILE" | cut -d'.' -f1)
            echo -e "${BLUE}   📏 Log Size: ${CYAN}$LOG_SIZE${NC}"
            echo -e "${BLUE}   ⏰ Last Updated: ${CYAN}$LOG_MODIFIED${NC}"
        fi
    else
        echo -e "${RED}❌ Import Process Status: ${BOLD}NOT RUNNING${NC}"
        echo -e "${RED}   💀 Process $PID not found (stale PID file)${NC}"
        echo -e "${YELLOW}   🧹 Cleaning up stale PID file...${NC}"
        rm -f "$PID_FILE"
        echo ""
        echo -e "${BLUE}💡 Possible reasons:${NC}"
        echo -e "${BLUE}   • Import completed successfully${NC}"
        echo -e "${BLUE}   • Process was terminated externally${NC}"  
        echo -e "${BLUE}   • System restart occurred${NC}"
        echo -e "${BLUE}   • Import encountered a fatal error${NC}"
        echo ""
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Import Process Status: ${BOLD}NO ACTIVE IMPORT${NC}"
    echo -e "${YELLOW}   📋 No PID file found at: $PID_FILE${NC}"
    echo ""
    echo -e "${BLUE}💡 To start a new import:${NC}"
    echo -e "${CYAN}   ./scripts/import_data.sh${NC}"
    echo ""
    exit 1
fi

# Enhanced monitor function with beautiful real-time display
monitor_import() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${GREEN}🎮 Starting Real-time Import Monitor${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📊 Live Statistics for ${IMPORT_TYPE} Import:${NC}"
    echo -e "${YELLOW}💡 Press Ctrl+C to exit monitoring${NC}"
    echo ""
    
    MONITOR_COUNT=0
    while ps -p "$PID" > /dev/null 2>&1; do
        if [ -f "$LOG_FILE" ]; then
            # Clear screen for better display (optional)
            if [ $MONITOR_COUNT -gt 0 ]; then
                echo -ne "\033[8A" # Move cursor up 8 lines
            fi
            
            # Extract latest progress information
            PROGRESS_LINE=$(tail -n 30 "$LOG_FILE" | grep "Progress:" | tail -n 1)
            SUCCESS_LINE=$(tail -n 20 "$LOG_FILE" | grep -E "(Success|✅)" | tail -n 1)
            ERROR_LINE=$(tail -n 20 "$LOG_FILE" | grep -E "(ERROR|❌|error)" | tail -n 1)
            
            # Current timestamp
            CURRENT_TIME=$(date '+%H:%M:%S')
            
            echo -e "${CYAN}🕐 Monitor Time: ${BOLD}$CURRENT_TIME${NC}"
            echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
            
            if [ -n "$PROGRESS_LINE" ]; then
                echo -e "${GREEN}📊 $PROGRESS_LINE${NC}"
            else
                echo -e "${YELLOW}📊 Initializing import process...${NC}"
            fi
            
            if [ -n "$SUCCESS_LINE" ]; then
                echo -e "${GREEN}✅ Latest: $SUCCESS_LINE${NC}"
            fi
            
            # Check for recent errors
            RECENT_ERRORS=$(tail -n 20 "$LOG_FILE" | grep -c "ERROR\|error\|❌")
            if [ "$RECENT_ERRORS" -gt 0 ]; then
                echo -e "${RED}⚠️  Recent errors detected: $RECENT_ERRORS${NC}"
                if [ -n "$ERROR_LINE" ]; then
                    echo -e "${RED}💥 Last error: ${ERROR_LINE:0:60}...${NC}"
                fi
            else
                echo -e "${GREEN}✅ No recent errors detected${NC}"
            fi
            
            # System resource info
            CPU_USAGE=$(ps -p "$PID" -o %cpu --no-headers 2>/dev/null || echo "N/A")
            MEM_USAGE=$(ps -p "$PID" -o %mem --no-headers 2>/dev/null || echo "N/A")
            echo -e "${BLUE}💻 CPU: ${CYAN}$CPU_USAGE%${NC} | ${BLUE}Memory: ${CYAN}$MEM_USAGE%${NC}"
            
            # Log file growth
            if [ -f "$LOG_FILE" ]; then
                LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
                echo -e "${BLUE}📄 Log Size: ${CYAN}$LOG_SIZE${NC}"
            fi
            
            echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
            
        else
            echo -e "${YELLOW}⏳ Waiting for log file to be created...${NC}"
        fi
        
        MONITOR_COUNT=$((MONITOR_COUNT + 1))
        sleep 3
    done
    
    # Import completed
    echo ""
    echo -e "${GREEN}"
    cat << "EOF"
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
🏆                    IMPORT PROCESS COMPLETED! 🏆                     
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
EOF
    echo -e "${NC}"
    
    # Show comprehensive final summary
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo -e "${BOLD}${BLUE}📋 Final Import Summary:${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
        
        # Extract final statistics
        FINAL_STATS=$(tail -n 50 "$LOG_FILE" | grep -E "(Total|Success|Error|completed|finished)" | tail -n 10)
        if [ -n "$FINAL_STATS" ]; then
            echo -e "${GREEN}$FINAL_STATS${NC}"
        fi
        
        # Check for error files
        ERROR_FILES=$(find . -name "*error*.json" -o -name "*invalid*.json" 2>/dev/null)
        if [ -n "$ERROR_FILES" ]; then
            echo ""
            echo -e "${YELLOW}📋 Error Reports Generated:${NC}"
            echo -e "${RED}$ERROR_FILES${NC}"
        fi
        
        echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🌟 Thank you for using My School Buddies Import Monitor! 🌟${NC}"
}

# Enhanced command handling with detailed help
case "${1:-monitor}" in
    "monitor")
        monitor_import
        ;;
        
    "logs")
        echo ""
        echo -e "${CYAN}📄 Live Log Streaming for ${IMPORT_TYPE} Import${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}💡 Press Ctrl+C to exit log streaming${NC}"
        echo ""
        
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE" | while read line; do
                # Color code different types of log messages
                if echo "$line" | grep -q "ERROR\|❌\|error"; then
                    echo -e "${RED}$line${NC}"
                elif echo "$line" | grep -q "SUCCESS\|✅\|completed"; then
                    echo -e "${GREEN}$line${NC}"
                elif echo "$line" | grep -q "Progress\|📊"; then
                    echo -e "${BLUE}$line${NC}"
                elif echo "$line" | grep -q "WARNING\|⚠️"; then
                    echo -e "${YELLOW}$line${NC}"
                else
                    echo "$line"
                fi
            done
        else
            echo -e "${RED}❌ Log file not found: $LOG_FILE${NC}"
            echo -e "${BLUE}💡 The import might not have started yet${NC}"
        fi
        ;;
        
    "status")
        echo ""
        echo -e "${CYAN}📊 Quick Status Check for ${IMPORT_TYPE} Import${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
        
        if [ -f "$LOG_FILE" ]; then
            echo -e "${BLUE}📈 Recent Progress:${NC}"
            tail -n 10 "$LOG_FILE" | grep -E "(Progress|completed|error|SUCCESS)" | tail -n 5
            
            echo ""
            echo -e "${BLUE}📊 Latest Statistics:${NC}"
            LATEST_PROGRESS=$(tail -n 20 "$LOG_FILE" | grep "Progress:" | tail -n 1)
            if [ -n "$LATEST_PROGRESS" ]; then
                echo -e "${GREEN}$LATEST_PROGRESS${NC}"
            else
                echo -e "${YELLOW}No progress information available yet${NC}"
            fi
            
            echo ""
            echo -e "${BLUE}🕐 Last 3 Log Entries:${NC}"
            tail -n 3 "$LOG_FILE"
        else
            echo -e "${RED}❌ No log file found${NC}"
            echo -e "${BLUE}💡 Import might not have started or logs not yet created${NC}"
        fi
        echo ""
        ;;
        
    "stop")
        echo ""
        echo -e "${CYAN}🛑 Stopping ${IMPORT_TYPE} Import Process${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
        
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            
            echo -e "${YELLOW}⚠️  Attempting to stop import process...${NC}"
            echo -e "${BLUE}   🆔 Process ID: $PID${NC}"
            
            # Try graceful shutdown first
            if ps -p "$PID" > /dev/null 2>&1; then
                echo -e "${BLUE}   📋 Sending termination signal...${NC}"
                kill -TERM "$PID" 2>/dev/null
                
                # Wait a few seconds for graceful shutdown
                sleep 5
                
                if ps -p "$PID" > /dev/null 2>&1; then
                    echo -e "${YELLOW}   ⚠️  Process still running, forcing shutdown...${NC}"
                    kill -KILL "$PID" 2>/dev/null
                    sleep 2
                fi
                
                if ! ps -p "$PID" > /dev/null 2>&1; then
                    echo -e "${GREEN}   ✅ Process successfully terminated${NC}"
                else
                    echo -e "${RED}   ❌ Failed to terminate process${NC}"
                fi
            else
                echo -e "${YELLOW}   💀 Process was already terminated${NC}"
            fi
            
            # Clean up PID file
            rm -f "$PID_FILE"
            echo -e "${BLUE}   🧹 Cleaned up PID file${NC}"
            echo ""
            echo -e "${GREEN}✅ Import stop procedure completed${NC}"
            
        else
            echo -e "${YELLOW}⚠️  No active import process found${NC}"
            echo -e "${BLUE}💡 No PID file exists, import is not running${NC}"
        fi
        echo ""
        ;;
        
    "help"|"-h"|"--help")
        echo ""
        echo -e "${CYAN}🎮 My School Buddies Import Monitor - Help${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${BOLD}USAGE:${NC}"
        echo -e "   ${GREEN}$0 [COMMAND]${NC}"
        echo ""
        echo -e "${BOLD}COMMANDS:${NC}"
        echo ""
        echo -e "${GREEN}   monitor${NC}      Real-time progress monitoring (default)"
        echo -e "               ${BLUE}↳ Shows live statistics, errors, and system resources${NC}"
        echo ""
        echo -e "${GREEN}   logs${NC}         Live log output streaming"
        echo -e "               ${BLUE}↳ Displays color-coded log messages in real-time${NC}"
        echo ""
        echo -e "${GREEN}   status${NC}       Quick status snapshot"
        echo -e "               ${BLUE}↳ Shows recent progress and latest log entries${NC}"
        echo ""
        echo -e "${GREEN}   stop${NC}         Stop the import process"
        echo -e "               ${BLUE}↳ Gracefully terminates the running import${NC}"
        echo ""
        echo -e "${GREEN}   help${NC}         Show this help message"
        echo -e "               ${BLUE}↳ Display usage information and examples${NC}"
        echo ""
        echo -e "${BOLD}EXAMPLES:${NC}"
        echo -e "   ${CYAN}$0${NC}                    # Start real-time monitoring"
        echo -e "   ${CYAN}$0 monitor${NC}            # Same as above"
        echo -e "   ${CYAN}$0 logs${NC}               # Stream live logs"
        echo -e "   ${CYAN}$0 status${NC}             # Quick status check"
        echo -e "   ${CYAN}$0 stop${NC}               # Stop import process"
        echo ""
        echo -e "${BOLD}FILES:${NC}"
        echo -e "   ${BLUE}Log File:${NC}    $LOG_FILE"
        echo -e "   ${BLUE}PID File:${NC}    $PID_FILE"
        echo ""
        ;;
        
    *)
        echo ""
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        echo -e "${BLUE}Available commands:${NC}"
        echo -e "   ${GREEN}monitor${NC}  - Real-time progress monitoring (default)"
        echo -e "   ${GREEN}logs${NC}     - Show live log output"  
        echo -e "   ${GREEN}status${NC}   - Show current status"
        echo -e "   ${GREEN}stop${NC}     - Stop the import process"
        echo -e "   ${GREEN}help${NC}     - Show detailed help"
        echo ""
        echo -e "${YELLOW}💡 Try: $0 help for detailed usage information${NC}"
        echo ""
        exit 1
        ;;
esac