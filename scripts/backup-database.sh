#!/bin/bash

# =============================================
# Database Backup Script for My School Buddies
# =============================================

set -e

# Load environment variables
if [ -f "backend/.env" ]; then
    set -a
    source backend/.env
    set +a
else
    echo "❌ Error: backend/.env file not found"
    exit 1
fi

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

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/myschoolbuddies_backup_${TIMESTAMP}.sql"
COMPRESSED_BACKUP="${BACKUP_FILE}.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

print_info "🔄 Starting database backup..."

# Check if psql is installed
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump is not installed. Please install PostgreSQL client."
    exit 1
fi

# Test database connection
print_info "📡 Testing database connection..."
export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    print_error "Cannot connect to database"
    print_error "   Host: $DB_HOST:$DB_PORT"
    print_error "   Database: $DB_NAME" 
    print_error "   User: $DB_USER"
    exit 1
fi

print_status "Database connection successful"

# Create backup
print_info "💾 Creating database backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-privileges \
    --create \
    --clean \
    --if-exists \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_status "Database backup created: $BACKUP_FILE"
else
    print_error "Failed to create database backup"
    exit 1
fi

# Compress backup
print_info "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_status "Backup compressed: $COMPRESSED_BACKUP"
    FINAL_BACKUP="$COMPRESSED_BACKUP"
else
    print_warning "Failed to compress backup, keeping uncompressed version"
    FINAL_BACKUP="$BACKUP_FILE"
fi

# Get backup size
BACKUP_SIZE=$(du -h "$FINAL_BACKUP" | cut -f1)

# Count tables and records
print_info "📊 Gathering database statistics..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')

SCHOOLS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schools;" 2>/dev/null | tr -d ' ' || echo "0")
USERS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
CLASSES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM classes;" 2>/dev/null | tr -d ' ' || echo "0")

# Clean up old backups (keep last 10)
print_info "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "myschoolbuddies_backup_*.sql*" -type f | sort | head -n -10 | xargs -r rm -f

echo ""
print_status "🎉 Database backup completed successfully!"
echo ""
echo "📋 Backup Summary:"
echo "   File: $FINAL_BACKUP"
echo "   Size: $BACKUP_SIZE"
echo "   Timestamp: $TIMESTAMP"
echo "   Tables: $TABLE_COUNT"
echo "   Schools: $SCHOOLS_COUNT"
echo "   Users: $USERS_COUNT"
echo "   Classes: $CLASSES_COUNT"
echo ""
echo "📝 To restore this backup:"
echo "   gunzip -c $FINAL_BACKUP | psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME"
echo ""

# Unset password
unset PGPASSWORD

# Return backup filename for use by other scripts
echo "$FINAL_BACKUP"