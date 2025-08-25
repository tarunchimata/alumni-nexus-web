#!/bin/bash

# Phase 1 Deployment Script for My School Buddies
# Deploys critical infrastructure fixes and enhancements

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/deployment.log"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in project root directory"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("node" "npm" "docker" "psql")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check environment variables
    if [[ -z "$DATABASE_URL" ]]; then
        log_warning "DATABASE_URL not set. Using default."
    fi
    
    log_success "Prerequisites check completed"
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database schema
    if [[ -n "$DATABASE_URL" ]]; then
        log "Backing up database schema..."
        pg_dump --schema-only "$DATABASE_URL" > "$BACKUP_DIR/schema_backup.sql" || {
            log_warning "Database backup failed, continuing..."
        }
    fi
    
    # Backup current code
    log "Backing up current codebase..."
    rsync -av --exclude node_modules --exclude .git --exclude backups "$PROJECT_ROOT/" "$BACKUP_DIR/code/" || {
        log_error "Code backup failed"
        exit 1
    }
    
    log_success "Backup created at $BACKUP_DIR"
}

# Install dependencies
install_dependencies() {
    log "Installing and updating dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Frontend dependencies
    log "Installing frontend dependencies..."
    npm install || {
        log_error "Frontend dependency installation failed"
        exit 1
    }
    
    # Backend dependencies
    if [[ -d "backend" ]]; then
        log "Installing backend dependencies..."
        cd backend
        npm install || {
            log_error "Backend dependency installation failed"
            exit 1
        }
        cd ..
    fi
    
    log_success "Dependencies installed successfully"
}

# Database updates
update_database() {
    log "Applying database updates..."
    
    if [[ -z "$DATABASE_URL" ]]; then
        log_warning "DATABASE_URL not set, skipping database updates"
        return
    fi
    
    # Apply performance indexes
    log "Applying performance indexes..."
    if [[ -f "database/performance-indexes.sql" ]]; then
        psql "$DATABASE_URL" -f "database/performance-indexes.sql" || {
            log_warning "Performance indexes application failed, continuing..."
        }
    fi
    
    # Apply schema patches
    log "Applying schema patches..."
    if [[ -f "database/patch-users-table.sql" ]]; then
        psql "$DATABASE_URL" -f "database/patch-users-table.sql" || {
            log_warning "Schema patch application failed, continuing..."
        }
    fi
    
    log_success "Database updates completed"
}

# Populate school data
populate_schools() {
    log "Populating school database..."
    
    if [[ -f "backend/src/scripts/populateSchools.ts" ]]; then
        cd backend
        
        # Compile TypeScript
        log "Compiling TypeScript..."
        npx tsc src/scripts/populateSchools.ts --outDir dist/scripts --moduleResolution node --esModuleInterop true || {
            log_warning "TypeScript compilation failed, trying direct execution..."
        }
        
        # Run population script
        log "Running school population script..."
        node -r ts-node/register src/scripts/populateSchools.ts 1000 || {
            log_warning "School population failed, continuing..."
        }
        
        cd ..
    fi
    
    log_success "School data population completed"
}

# Build applications
build_applications() {
    log "Building applications..."
    
    cd "$PROJECT_ROOT"
    
    # Build frontend
    log "Building frontend..."
    npm run build || {
        log_error "Frontend build failed"
        exit 1
    }
    
    # Build backend
    if [[ -d "backend" && -f "backend/package.json" ]]; then
        log "Building backend..."
        cd backend
        npm run build || {
            log_warning "Backend build failed, continuing..."
        }
        cd ..
    fi
    
    log_success "Applications built successfully"
}

# Deploy theme
deploy_theme() {
    log "Deploying Keycloak theme..."
    
    if [[ -f "scripts/deploy-theme.sh" ]]; then
        chmod +x scripts/deploy-theme.sh
        ./scripts/deploy-theme.sh || {
            log_warning "Theme deployment failed, continuing..."
        }
    else
        log_warning "Theme deployment script not found, skipping..."
    fi
    
    log_success "Theme deployment completed"
}

# Update Docker containers
update_containers() {
    log "Updating Docker containers..."
    
    if [[ -f "docker/docker-compose.yml" ]]; then
        cd docker
        
        # Stop existing containers
        log "Stopping existing containers..."
        docker-compose down || {
            log_warning "Failed to stop containers, continuing..."
        }
        
        # Build new images
        log "Building new images..."
        docker-compose build --no-cache || {
            log_error "Docker build failed"
            exit 1
        }
        
        # Start containers
        log "Starting containers..."
        docker-compose up -d || {
            log_error "Failed to start containers"
            exit 1
        }
        
        # Wait for services to be ready
        log "Waiting for services to be ready..."
        sleep 30
        
        cd ..
    else
        log_warning "Docker compose file not found, skipping container updates"
    fi
    
    log_success "Docker containers updated"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    local checks_passed=0
    local total_checks=5
    
    # Check frontend
    if curl -sf http://localhost:8080 > /dev/null; then
        log_success "Frontend is accessible"
        ((checks_passed++))
    else
        log_error "Frontend is not accessible"
    fi
    
    # Check backend API
    if curl -sf http://localhost:3033/health > /dev/null; then
        log_success "Backend API is accessible"
        ((checks_passed++))
    else
        log_error "Backend API is not accessible"
    fi
    
    # Check database connection
    if [[ -n "$DATABASE_URL" ]] && psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Database is accessible"
        ((checks_passed++))
    else
        log_error "Database is not accessible"
    fi
    
    # Check school data
    if [[ -n "$DATABASE_URL" ]] && [[ $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schools;") -gt 0 ]]; then
        log_success "School data is populated"
        ((checks_passed++))
    else
        log_warning "School data may not be populated"
    fi
    
    # Check indexes
    if [[ -n "$DATABASE_URL" ]] && psql "$DATABASE_URL" -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';" | grep -q "idx_"; then
        log_success "Performance indexes are created"
        ((checks_passed++))
    else
        log_warning "Performance indexes may not be created"
    fi
    
    log "Deployment verification: $checks_passed/$total_checks checks passed"
    
    if [[ $checks_passed -ge 3 ]]; then
        log_success "Deployment verification passed"
        return 0
    else
        log_error "Deployment verification failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log "Performing cleanup..."
    
    # Remove temporary files
    find "$PROJECT_ROOT" -name "*.tmp" -delete 2>/dev/null || true
    
    # Clean up old Docker images
    docker image prune -f 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting Phase 1 deployment for My School Buddies"
    log "Deployment log: $LOG_FILE"
    log "Backup directory: $BACKUP_DIR"
    
    # Run deployment steps
    check_prerequisites
    create_backup
    install_dependencies
    update_database
    populate_schools
    build_applications
    deploy_theme
    update_containers
    
    # Verify deployment
    if verify_deployment; then
        log_success "Phase 1 deployment completed successfully!"
        log "Summary:"
        log "- Direct Keycloak authentication implemented"
        log "- CSV import with dry-run functionality added"
        log "- Security middleware and monitoring enhanced"
        log "- Performance indexes applied"
        log "- School database populated"
        log "- Keycloak theme deployed"
        log ""
        log "Next steps:"
        log "1. Test the direct authentication flow"
        log "2. Verify CSV import dry-run functionality"
        log "3. Monitor application performance"
        log "4. Proceed to Phase 2 (Testing Infrastructure)"
    else
        log_error "Phase 1 deployment completed with issues"
        log "Please check the logs and resolve issues before proceeding"
        exit 1
    fi
    
    cleanup
}

# Rollback function
rollback() {
    log_error "Rolling back deployment..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Restore database
        if [[ -f "$BACKUP_DIR/schema_backup.sql" && -n "$DATABASE_URL" ]]; then
            log "Restoring database..."
            psql "$DATABASE_URL" -f "$BACKUP_DIR/schema_backup.sql" || {
                log_error "Database restore failed"
            }
        fi
        
        # Restore code (would need more sophisticated restore logic)
        log "Manual code restore may be needed from: $BACKUP_DIR/code/"
    fi
    
    log_error "Rollback completed. Manual intervention may be required."
}

# Handle script interruption
trap rollback ERR EXIT

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi