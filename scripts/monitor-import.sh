#!/bin/bash

################################################################################
# 📊 Import Monitoring Script
# Monitors bulk school import progress and provides real-time statistics
################################################################################

LOG_DIR="/var/log/school-import"
LOG_FILE="$LOG_DIR/import.log"
PID_FILE="$LOG_DIR/import.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📊 School Import Monitor"
echo "======================="

# Check if import is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Import is running (PID: $PID)${NC}"
    else
        echo -e "${RED}❌ Import process not found (stale PID file)${NC}"
        rm -f "$PID_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No active import process found${NC}"
    exit 1
fi

# Monitor function
monitor_import() {
    echo ""
    echo "📈 Live Statistics:"
    echo "=================="
    
    while ps -p "$PID" > /dev/null 2>&1; do
        if [ -f "$LOG_FILE" ]; then
            # Extract latest progress line
            PROGRESS_LINE=$(tail -n 20 "$LOG_FILE" | grep "Progress:" | tail -n 1)
            
            if [ -n "$PROGRESS_LINE" ]; then
                echo -e "${BLUE}📊 $PROGRESS_LINE${NC}"
            fi
            
            # Check for errors
            RECENT_ERRORS=$(tail -n 10 "$LOG_FILE" | grep -c "ERROR\|error")
            if [ "$RECENT_ERRORS" -gt 0 ]; then
                echo -e "${RED}⚠️  Recent errors detected: $RECENT_ERRORS${NC}"
            fi
        fi
        
        sleep 5
        echo -ne "\033[1A\033[K" # Clear previous line
    done
    
    echo -e "${GREEN}✅ Import process completed${NC}"
    
    # Show final summary
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "📋 Final Summary:"
        echo "================"
        tail -n 10 "$LOG_FILE" | grep -E "(completed|SUCCESS|Import time)"
    fi
}

# Options
case "${1:-monitor}" in
    "monitor")
        monitor_import
        ;;
    "logs")
        echo "📄 Live Logs (Press Ctrl+C to exit):"
        echo "===================================="
        tail -f "$LOG_FILE"
        ;;
    "status")
        echo "📊 Current Status:"
        echo "=================="
        if [ -f "$LOG_FILE" ]; then
            tail -n 5 "$LOG_FILE" | grep -E "(Progress|completed|error)"
        else
            echo "No log file found"
        fi
        ;;
    "stop")
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            echo "🛑 Stopping import process (PID: $PID)..."
            kill "$PID" 2>/dev/null
            rm -f "$PID_FILE"
            echo -e "${GREEN}✅ Import stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  No active import to stop${NC}"
        fi
        ;;
    *)
        echo "Usage: $0 [monitor|logs|status|stop]"
        echo ""
        echo "Commands:"
        echo "  monitor  - Real-time progress monitoring (default)"
        echo "  logs     - Show live log output"
        echo "  status   - Show current status"
        echo "  stop     - Stop the import process"
        ;;
esac