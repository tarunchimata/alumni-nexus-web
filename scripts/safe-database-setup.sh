#!/bin/bash

# =============================================
# Safe Database Setup Script for My School Buddies
# This script includes safety checks and backup creation
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

# Configuration
FORCE_RESET=${FORCE_RESET:-false}
ENABLE_DEMO_USERS=${ENABLE_DEMO_USERS:-true}
ENVIRONMENT=${NODE_ENV:-development}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --force-reset       Drop and recreate all tables (DANGEROUS)"
    echo "  --no-demo-users     Skip demo user creation"
    echo "  --environment ENV   Set deployment environment (dev/staging/prod)"
    echo "  --safe              Safe mode - only create missing tables (default)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  FORCE_RESET=true          Same as --force-reset"
    echo "  ENABLE_DEMO_USERS=false   Same as --no-demo-users"
    echo "  NODE_ENV=production       Set environment mode"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump is not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

test_database_connection() {
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
}

check_existing_data() {
    print_info "🔍 Checking for existing data..."
    
    # Check if tables exist
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        print_warning "Found $TABLE_COUNT existing tables"
        
        # Check for data in key tables
        SCHOOLS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schools;" 2>/dev/null | tr -d ' ' || echo "0")
        USERS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
        CLASSES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM classes;" 2>/dev/null | tr -d ' ' || echo "0")
        
        if [ "$SCHOOLS_COUNT" -gt 0 ] || [ "$USERS_COUNT" -gt 0 ] || [ "$CLASSES_COUNT" -gt 0 ]; then
            echo ""
            print_warning "⚠️  EXISTING DATA DETECTED ⚠️"
            echo ""
            echo "Found data in database:"
            echo "   Schools: $SCHOOLS_COUNT"
            echo "   Users: $USERS_COUNT"
            echo "   Classes: $CLASSES_COUNT"
            echo ""
            
            return 1  # Indicates existing data found
        fi
    fi
    
    print_status "No existing data found"
    return 0  # Safe to proceed
}

create_backup() {
    print_info "💾 Creating backup before deployment..."
    
    if [ -f "scripts/backup-database.sh" ]; then
        backup_file=$(./scripts/backup-database.sh | tail -1)
        print_status "Backup created: $backup_file"
        echo "$backup_file"
    else
        print_warning "Backup script not found, skipping backup"
        echo ""
    fi
}

deploy_safe_schema() {
    print_info "🏗️  Deploying safe schema (CREATE IF NOT EXISTS)..."
    
    if [ -f "database/schema-safe.sql" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema-safe.sql
        print_status "Safe schema deployment completed"
    else
        print_error "Safe schema file not found: database/schema-safe.sql"
        exit 1
    fi
}

deploy_destructive_schema() {
    local backup_file=$1
    
    print_info "🔥 Deploying destructive schema (DROP and CREATE)..."
    
    if [ -f "database/schema.sql" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql
        print_status "Destructive schema deployment completed"
        
        if [ -n "$backup_file" ]; then
            print_info "Previous backup available for rollback: $backup_file"
        fi
    else
        print_error "Schema file not found: database/schema.sql"
        exit 1
    fi
}

deploy_seed_data() {
    if [ "$ENABLE_DEMO_USERS" != true ]; then
        print_info "Skipping seed data (demo users disabled)"
        return
    fi
    
    print_info "🌱 Inserting seed data..."
    
    if [ -f "database/seed-data.sql" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/seed-data.sql || {
            print_warning "Seed data insertion failed or already exists"
        }
        print_status "Seed data deployment completed"
    else
        print_warning "Seed data file not found: database/seed-data.sql"
    fi
}

verify_deployment() {
    print_info "🔍 Verifying database deployment..."
    
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
    
    if [ "$TABLE_COUNT" -ge 5 ]; then
        print_status "Database verification successful ($TABLE_COUNT tables found)"
    else
        print_error "Database verification failed (expected at least 5 tables, found $TABLE_COUNT)"
        exit 1
    fi
    
    # Show table information
    echo ""
    print_info "📊 Database Tables:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"
    
    # Show data summary
    SCHOOLS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schools;" 2>/dev/null | tr -d ' ' || echo "0")
    USERS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    CLASSES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM classes;" 2>/dev/null | tr -d ' ' || echo "0")
    
    echo ""
    print_status "📋 Database Summary:"
    echo "   Environment: $ENVIRONMENT"
    echo "   Tables: $TABLE_COUNT"
    echo "   Schools: $SCHOOLS_COUNT"
    echo "   Users: $USERS_COUNT"
    echo "   Classes: $CLASSES_COUNT"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force-reset)
            FORCE_RESET=true
            shift
            ;;
        --no-demo-users)
            ENABLE_DEMO_USERS=false
            shift
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --safe)
            FORCE_RESET=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main deployment logic
print_info "🚀 Starting safe database setup..."
echo ""
echo "Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Force Reset: $FORCE_RESET"
echo "   Demo Users: $ENABLE_DEMO_USERS"
echo "   Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

check_prerequisites
test_database_connection

# Check for existing data
if check_existing_data; then
    # No existing data, safe to proceed
    print_info "Proceeding with fresh deployment"
    deploy_safe_schema
    deploy_seed_data
else
    # Existing data found
    if [ "$FORCE_RESET" = true ]; then
        if [ "$ENVIRONMENT" = "production" ] && [ -z "$FORCE_PRODUCTION_RESET" ]; then
            print_error "Cannot reset production database without FORCE_PRODUCTION_RESET=true"
            exit 1
        fi
        
        echo ""
        print_warning "⚠️  DESTRUCTIVE OPERATION WARNING ⚠️"
        echo ""
        echo "This will permanently delete ALL existing data!"
        echo "Type 'DELETE ALL DATA' to confirm:"
        read -r confirmation
        
        if [ "$confirmation" != "DELETE ALL DATA" ]; then
            print_info "Operation cancelled"
            exit 0
        fi
        
        backup_file=$(create_backup)
        deploy_destructive_schema "$backup_file"
        deploy_seed_data
    else
        print_info "Using safe deployment mode"
        deploy_safe_schema
        
        if [ "$ENABLE_DEMO_USERS" = true ]; then
            print_warning "Skipping seed data insertion (existing data found)"
        fi
    fi
fi

verify_deployment

echo ""
print_status "🎉 Database setup completed successfully!"
echo ""
print_info "🔧 Available management commands:"
echo "   Backup:   ./scripts/backup-database.sh"
echo "   Rollback: ./scripts/rollback.sh --latest"
echo "   List:     ./scripts/rollback.sh --list"
echo ""

# Unset password
unset PGPASSWORD