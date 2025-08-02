#!/bin/bash

# =============================================
# Database Rollback Script for My School Buddies
# =============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Load environment variables
if [ -f "backend/.env" ]; then
    set -a
    source backend/.env
    set +a
else
    print_error "backend/.env file not found"
    exit 1
fi

BACKUP_DIR="backups"

show_usage() {
    echo "Usage: $0 [backup_file] [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --latest        Use the latest backup automatically"
    echo "  --list          List available backups"
    echo "  --force         Skip confirmation prompts"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --latest                                    # Restore latest backup"
    echo "  $0 --list                                      # List all backups"
    echo "  $0 backups/myschoolbuddies_backup_20241201_143022.sql.gz  # Restore specific backup"
}

list_backups() {
    print_info "📋 Available backups:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "No backup directory found"
        return
    fi
    
    backups=($(find "$BACKUP_DIR" -name "myschoolbuddies_backup_*.sql*" -type f | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        print_warning "No backups found"
        return
    fi
    
    for i in "${!backups[@]}"; do
        backup="${backups[$i]}"
        size=$(du -h "$backup" | cut -f1)
        timestamp=$(basename "$backup" | sed 's/myschoolbuddies_backup_\(.*\)\.sql.*/\1/' | sed 's/_/ /')
        echo "$((i+1)). $backup (Size: $size, Date: $timestamp)"
    done
    echo ""
}

get_latest_backup() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "No backup directory found"
        exit 1
    fi
    
    latest=$(find "$BACKUP_DIR" -name "myschoolbuddies_backup_*.sql*" -type f | sort -r | head -1)
    
    if [ -z "$latest" ]; then
        print_error "No backups found"
        exit 1
    fi
    
    echo "$latest"
}

restore_backup() {
    local backup_file=$1
    local force=${2:-false}
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_info "🔄 Preparing to restore backup: $backup_file"
    
    # Get backup info
    backup_size=$(du -h "$backup_file" | cut -f1)
    backup_name=$(basename "$backup_file")
    
    echo ""
    print_warning "⚠️  DATABASE RESTORATION WARNING ⚠️"
    echo ""
    echo "This operation will:"
    echo "   • DROP all existing tables and data"
    echo "   • RESTORE data from: $backup_name"
    echo "   • Size: $backup_size"
    echo "   • This action is IRREVERSIBLE"
    echo ""
    
    if [ "$force" != true ]; then
        echo "Type 'RESTORE DATABASE' to confirm:"
        read -r confirmation
        
        if [ "$confirmation" != "RESTORE DATABASE" ]; then
            print_info "Operation cancelled"
            exit 0
        fi
    fi
    
    # Test database connection
    print_info "📡 Testing database connection..."
    export PGPASSWORD="$DB_PASSWORD"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to database"
        exit 1
    fi
    
    print_status "Database connection successful"
    
    # Create a backup before restoration (safety measure)
    print_info "💾 Creating safety backup before restoration..."
    safety_backup=$(./scripts/backup-database.sh | tail -1)
    print_status "Safety backup created: $safety_backup"
    
    # Restore the backup
    print_info "🔄 Restoring database from backup..."
    
    if [[ "$backup_file" == *.gz ]]; then
        # Compressed backup
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
    else
        # Uncompressed backup
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Database restoration completed successfully"
    else
        print_error "Database restoration failed"
        print_info "You can restore the safety backup if needed: $safety_backup"
        exit 1
    fi
    
    # Verify restoration
    print_info "🔍 Verifying restoration..."
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
    
    if [ "$TABLE_COUNT" -ge 5 ]; then
        print_status "Database verification successful ($TABLE_COUNT tables found)"
    else
        print_warning "Database verification failed (expected at least 5 tables, found $TABLE_COUNT)"
    fi
    
    # Show summary
    SCHOOLS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schools;" 2>/dev/null | tr -d ' ' || echo "0")
    USERS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    
    echo ""
    print_status "🎉 Database rollback completed!"
    echo ""
    echo "📊 Restored Database Summary:"
    echo "   Tables: $TABLE_COUNT"
    echo "   Schools: $SCHOOLS_COUNT"
    echo "   Users: $USERS_COUNT"
    echo "   Safety backup: $safety_backup"
    echo ""
    
    # Unset password
    unset PGPASSWORD
}

# Parse arguments
FORCE=false
LATEST=false
LIST=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --latest)
            LATEST=true
            shift
            ;;
        --list)
            LIST=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            BACKUP_FILE=$1
            shift
            ;;
    esac
done

# Main logic
if [ "$LIST" = true ]; then
    list_backups
    exit 0
fi

if [ "$LATEST" = true ]; then
    BACKUP_FILE=$(get_latest_backup)
    print_info "Using latest backup: $BACKUP_FILE"
fi

if [ -z "$BACKUP_FILE" ]; then
    print_error "No backup file specified"
    echo ""
    show_usage
    exit 1
fi

restore_backup "$BACKUP_FILE" "$FORCE"