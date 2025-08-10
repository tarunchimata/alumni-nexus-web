#!/bin/bash

# =============================================
# My School Buddies Deployment Script
# =============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="dev"
SKIP_BUILD=false
SKIP_DB=false
FORCE_RESET=false
ENABLE_DEMO_USERS=true
LOG_DIR="logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Print colored output
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

# Logging function
log_message() {
    local level=$1
    local message=$2
    local log_file="${LOG_DIR}/deploy_${TIMESTAMP}.log"
    
    mkdir -p "$LOG_DIR"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" >> "$log_file"
    
    case $level in
        "ERROR")
            print_error "$message"
            ;;
        "WARNING") 
            print_warning "$message"
            ;;
        "INFO")
            print_info "$message"
            ;;
        "SUCCESS")
            print_status "$message"
            ;;
    esac
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  menu        Show interactive menu (default)"
    echo "  dev         Start development environment"
    echo "  prod        Start production environment"
    echo "  build       Build frontend and backend"
    echo "  start       Start services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        Show application logs"
    echo "  health      Check service health"
    echo "  db-setup    Set up database schema (safe mode)"
    echo "  db-reset    Reset database (destructive)"
    echo "  backup      Create database backup"
    echo "  rollback    Rollback to previous backup"
    echo "  demo-users  Create demo users"
    echo "  clean       Clean up containers and volumes"
    echo ""
    echo "Options:"
    echo "  --skip-build        Skip build step"
    echo "  --skip-db           Skip database setup"
    echo "  --force-reset       Force database reset (dangerous)"
    echo "  --no-demo-users     Skip demo user creation"
    echo "  --environment ENV   Set environment (dev/staging/prod)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  NODE_ENV            Set deployment environment"
    echo "  FORCE_RESET         Enable destructive database operations"
    echo "  ENABLE_DEMO_USERS   Control demo user creation"
}

# Function to check npm compatibility and fix if needed
fix_npm_compatibility() {
    local npm_version=$(npm --version 2>/dev/null || echo "0.0.0")
    local node_version=$(node --version | sed 's/v//')
    
    # Check if npm version is too high for current Node.js
    if [[ "$npm_version" > "10.0.0" ]] && [[ "$node_version" < "20.0.0" ]]; then
        log_message "WARNING" "npm $npm_version incompatible with Node.js $node_version"
        log_message "INFO" "Downgrading npm to compatible version..."
        
        # Downgrade npm to compatible version
        npm install -g npm@9.2.0 --force || {
            log_message "WARNING" "Failed to downgrade npm, using npx for package management"
            # Use npx as fallback
            alias npm="npx npm@9.2.0"
        }
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    # Fix npm compatibility first
    fix_npm_compatibility
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        REQUIRED_VERSION="20.19.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
            log_message "WARNING" "Node.js version $NODE_VERSION detected. Recommended: $REQUIRED_VERSION+"
        else
            log_message "SUCCESS" "Node.js version $NODE_VERSION is compatible"
        fi
    else
        log_message "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_message "ERROR" "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_message "ERROR" "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_message "ERROR" "npm is not installed"
        exit 1
    fi
    
    # Check disk space (minimum 2GB)
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 2097152 ]; then  # 2GB in KB
        log_message "WARNING" "Low disk space detected. Available: $(($available_space/1024))MB"
    fi
    
    log_message "SUCCESS" "Prerequisites check passed"
}

# Function to set up environment
setup_environment() {
    local mode=$1
    print_info "Setting up $mode environment..."
    
    # Create directories
    mkdir -p logs uploads backups docker/nginx/ssl
    
    # Copy environment files
    if [ "$mode" = "prod" ]; then
        if [ -f ".env.production" ]; then
            cp .env.production .env
            print_status "Production frontend environment configured"
        else
            print_error "Production environment file not found"
            exit 1
        fi
        
        if [ -f "backend/.env.production" ]; then
            cp backend/.env.production backend/.env
            print_status "Production backend environment configured"
        else
            print_error "Production backend environment file not found"
            exit 1
        fi
    else
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                cp .env.example .env
                print_warning "Development environment created from example. Please review settings."
            else
                print_error "No environment file found"
                exit 1
            fi
        fi
        
        if [ ! -f "backend/.env" ]; then
            if [ -f "backend/.env.example" ]; then
                cp backend/.env.example backend/.env
                print_warning "Backend development environment created from example. Please review settings."
            else
                print_error "No backend environment file found"
                exit 1
            fi
        fi
    fi
}

# Function to validate environment
validate_environment() {
    print_info "Validating environment configuration..."
    
    # Check frontend env
    if [ -f ".env" ]; then
        if grep -q "VITE_KEYCLOAK_URL" .env && grep -q "VITE_OAUTH2_REDIRECT_URI" .env; then
            print_status "Frontend environment validated"
        else
            print_error "Frontend environment missing required variables"
            exit 1
        fi
    fi
    
    # Check backend env
    if [ -f "backend/.env" ]; then
        if grep -q "DATABASE_URL" backend/.env && grep -q "KEYCLOAK_URL" backend/.env; then
            print_status "Backend environment validated"
        else
            print_error "Backend environment missing required variables"
            exit 1
        fi
    fi
}

# Function to set up database safely
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        log_message "WARNING" "Skipping database setup"
        return
    fi
    
    log_message "INFO" "Setting up database safely..."
    
    if [ -f "scripts/safe-database-setup.sh" ]; then
        local db_options=""
        
        if [ "$FORCE_RESET" = true ]; then
            db_options="$db_options --force-reset"
        fi
        
        if [ "$ENABLE_DEMO_USERS" != true ]; then
            db_options="$db_options --no-demo-users"
        fi
        
        if [ -n "$MODE" ]; then
            db_options="$db_options --environment $MODE"
        fi
        
        ./scripts/safe-database-setup.sh $db_options
        log_message "SUCCESS" "Safe database setup completed"
    else
        log_message "WARNING" "Safe database setup script not found, using legacy method"
        
        # Fallback to legacy method
        if [ -f "database/schema.sql" ]; then
            set -a
            source backend/.env
            set +a
            
            log_message "INFO" "Loading database schema..."
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/schema.sql || {
                log_message "WARNING" "Schema load failed or already exists"
            }
            
            if [ -f "database/seed-data.sql" ] && [ "$ENABLE_DEMO_USERS" = true ]; then
                log_message "INFO" "Loading seed data..."
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/seed-data.sql || {
                    log_message "WARNING" "Seed data load failed or already exists"
                }
            fi
            
            log_message "SUCCESS" "Legacy database setup completed"
        else
            log_message "WARNING" "Database schema file not found"
        fi
    fi
}

# Function to reset database (destructive)
reset_database() {
    log_message "WARNING" "Database reset requested (destructive operation)"
    
    if [ -f "scripts/safe-database-setup.sh" ]; then
        FORCE_RESET=true ./scripts/safe-database-setup.sh --force-reset --environment "$MODE"
        log_message "SUCCESS" "Database reset completed"
    else
        log_message "ERROR" "Safe database setup script not found"
        exit 1
    fi
}

# Function to backup database
backup_database() {
    log_message "INFO" "Creating database backup..."
    
    if [ -f "scripts/backup-database.sh" ]; then
        ./scripts/backup-database.sh
        log_message "SUCCESS" "Database backup completed"
    else
        log_message "ERROR" "Backup script not found"
        exit 1
    fi
}

# Function to rollback database
rollback_database() {
    log_message "WARNING" "Database rollback requested"
    
    if [ -f "scripts/rollback.sh" ]; then
        ./scripts/rollback.sh --latest
        log_message "SUCCESS" "Database rollback completed"
    else
        log_message "ERROR" "Rollback script not found"
        exit 1
    fi
}

# Function to build application
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build step"
        return
    fi

    print_info "Building Docker images (frontend and backend)..."

    pushd docker >/dev/null
    docker-compose build --no-cache
    popd >/dev/null

    print_status "Docker images built successfully"
}

# Function to start services
start_services() {
    print_info "Starting services..."
    
    cd docker
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    cd ..
    
    print_status "Services started"
    
    # Wait for services
    print_info "Waiting for services to be ready..."
    sleep 30
    
    check_health
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    
    cd docker
    docker-compose down
    cd ..
    
    print_status "Services stopped"
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    stop_services
    sleep 5
    start_services
}

# Function to check health
check_health() {
    log_message "INFO" "Checking service health..."
    
    local backend_healthy=false
    local frontend_healthy=false
    local database_healthy=false
    
    # Check backend health with retry (try both development and docker ports)
    for i in {1..5}; do
        if curl -f http://localhost:3001/health > /dev/null 2>&1 || curl -f http://localhost:3005/health > /dev/null 2>&1; then
            backend_healthy=true
            break
        fi
        log_message "INFO" "Backend health check attempt $i/5 failed, retrying..."
        sleep 5
    done
    
    # Check frontend (try all possible ports)
    if curl -f http://localhost:3000 > /dev/null 2>&1 || curl -f http://localhost:8080 > /dev/null 2>&1 || curl -f http://localhost:3006 > /dev/null 2>&1; then
        frontend_healthy=true
    fi
    
    # Check database connection
    if [ -f "backend/.env" ]; then
        set -a
        source backend/.env
        set +a
        
        export PGPASSWORD="$DB_PASSWORD"
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            database_healthy=true
        fi
        unset PGPASSWORD
    fi
    
    # Report health status
    if [ "$backend_healthy" = true ]; then
        log_message "SUCCESS" "Backend service is healthy"
    else
        log_message "ERROR" "Backend service is not responding"
    fi
    
    if [ "$frontend_healthy" = true ]; then
        log_message "SUCCESS" "Frontend service is healthy"
    else
        log_message "ERROR" "Frontend service is not responding"
    fi
    
    if [ "$database_healthy" = true ]; then
        log_message "SUCCESS" "Database connection is healthy"
    else
        log_message "ERROR" "Database connection failed"
    fi
    
    # Show running containers
    echo ""
    log_message "INFO" "Running containers:"
    cd docker && docker-compose ps && cd ..
    
    # Overall health status
    if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ] && [ "$database_healthy" = true ]; then
        log_message "SUCCESS" "All services are healthy"
        return 0
    else
        log_message "ERROR" "Some services are unhealthy"
        return 1
    fi
}

# Function to show logs
show_logs() {
    print_info "Showing application logs..."
    cd docker
    docker-compose logs -f --tail=100
    cd ..
}

# Function to create demo users
create_demo_users() {
    print_info "Creating demo users..."
    
    if [ -f "scripts/create-demo-users.js" ]; then
        cd scripts
        node create-demo-users.js
        cd ..
        print_status "Demo users created"
    else
        print_warning "Demo users script not found"
    fi
}

# Function to clean up
cleanup() {
    print_info "Cleaning up..."
    
    cd docker
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    cd ..
    
    print_status "Cleanup completed"
}

# Function to show interactive menu
show_menu() {
    while true; do
        echo ""
        echo "================================================"
        echo "    🎓 My School Buddies Deployment Hub 🎓    "
        echo "================================================"
        echo ""
        echo "🚀 DEPLOYMENT:"
        echo "  1. Deploy Development Environment"
        echo "  2. Deploy Production Environment" 
        echo "  3. Build Application Only"
        echo "  4. Deploy with Docker (Production)"
        echo "  5. Full Production Deployment"
        echo ""
        echo "🔧 SERVICE MANAGEMENT:"
        echo "  6. Start Services"
        echo "  7. Stop Services"
        echo "  8. Restart Services"
        echo "  9. Check Health Status"
        echo "  10. Show Application Logs"
        echo "  11. Docker Container Status"
        echo ""
        echo "💾 DATABASE OPERATIONS:"
        echo "  12. Setup Database (Safe Mode)"
        echo "  13. Reset Database (Destructive)"
        echo "  14. Create Database Backup"
        echo "  15. Rollback to Previous Backup"
        echo "  16. Create Demo Users"
        echo ""
        echo "🧹 MAINTENANCE:"
        echo "  17. Clean Up Resources"
        echo "  18. View Deployment Logs"
        echo "  19. Fix Dependencies & Security"
        echo "  20. Clean Build Cache"
        echo "  21. Exit"
        echo ""
        echo "Current Environment: $MODE | Demo Users: $ENABLE_DEMO_USERS"
        echo ""
        read -p "Select an option [1-21]: " choice
        
        case $choice in
            1)
                MODE="dev"
                deploy_dev
                ;;
            2)
                MODE="prod"
                deploy_prod
                ;;
            3)
                build_application
                ;;
            4)
                deploy_docker_prod
                ;;
            5)
                full_production_deployment
                ;;
            6)
                start_services
                ;;
            7)
                stop_services
                ;;
            8)
                restart_services
                ;;
            9)
                check_health
                ;;
            10)
                show_logs
                ;;
            11)
                docker_status
                ;;
            12)
                setup_database
                ;;
            13)
                reset_database
                ;;
            14)
                backup_database
                ;;
            15)
                rollback_database
                ;;
            16)
                create_demo_users
                ;;
            17)
                cleanup
                ;;
            18)
                echo "📋 Recent deployment logs:"
                ls -la logs/deploy_*.log 2>/dev/null | tail -5 || echo "No deployment logs found"
                ;;
            19)
                print_info "Fixing dependencies and security issues..."
                if [ -f "scripts/fix-dependencies.sh" ]; then
                    chmod +x scripts/fix-dependencies.sh
                    ./scripts/fix-dependencies.sh
                else
                    fix_dependencies
                fi
                ;;
            20)
                clean_build_cache
                ;;
            21)
                log_message "SUCCESS" "Deployment session ended"
                exit 0
                ;;
            *)
                log_message "ERROR" "Invalid option. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Function to deploy development environment
deploy_dev() {
    print_info "🚀 Deploying Development Environment..."
    MODE="dev"
    check_prerequisites
    setup_environment $MODE
    validate_environment
    setup_database
    build_application
    start_services
    
    echo ""
    print_status "🎉 Development deployment completed!"
    echo ""
    echo "📋 Access Information:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   API Documentation: http://localhost:3001/api-docs"
    echo ""
}

# Function to deploy production environment
deploy_prod() {
    print_info "🌟 Deploying Production Environment..."
    MODE="prod"
    check_prerequisites
    setup_environment $MODE
    validate_environment
    setup_database
    build_application
    start_services
    
    echo ""
    print_status "🎉 Production deployment completed!"
    echo ""
    echo "📋 Access Information:"
    echo "   Frontend: https://school.hostingmanager.in"
    echo "   Backend API: https://api.hostingmanager.in"
    echo ""
}

# Function to deploy with Docker (Production focused)
deploy_docker_prod() {
    print_info "🐳 Deploying with Docker (Production)..."
    MODE="prod"
    check_prerequisites
    setup_environment $MODE
    validate_environment
    
    # Clean build cache first
    clean_build_cache
    
    # Build and deploy with Docker
    setup_database
    build_application
    
    print_info "Building and starting Docker containers..."
    cd docker
    docker-compose build --no-cache
    docker-compose up -d --force-recreate
    cd ..
    
    print_info "Waiting for containers to be ready..."
    sleep 45
    
    # Enhanced health checks
    docker_health_check
    
    print_status "🎉 Docker production deployment completed!"
    docker_status
}

# Function for full production deployment
full_production_deployment() {
    print_info "🌟 Full Production Deployment Starting..."
    MODE="prod"
    
    # Prerequisites with Node.js version check
    check_prerequisites
    
    # Fix dependencies first
    fix_dependencies
    
    # Environment setup
    setup_environment $MODE
    validate_environment
    
    # Database operations
    backup_database
    setup_database
    
    # Clean build
    clean_build_cache
    
    # Build with optimization
    build_application
    
    # Docker deployment
    print_info "Deploying with Docker..."
    cd docker
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    cd ..
    
    # Wait and verify
    print_info "Verifying deployment..."
    sleep 60
    docker_health_check
    
    # Create demo users if enabled
    if [ "$ENABLE_DEMO_USERS" = true ]; then
        create_demo_users
    fi
    
    print_status "🎉 Full production deployment completed!"
    echo ""
    echo "📋 Production Information:"
    echo "   Frontend: https://school.hostingmanager.in"
    echo "   Backend API: https://api.hostingmanager.in"
    echo "   Keycloak: https://login.hostingmanager.in"
    echo ""
    docker_status
}

# Function to check Docker container health
docker_health_check() {
    print_info "Checking Docker container health..."
    
    cd docker
    
    # Check container status
    local containers_healthy=true
    for service in backend frontend nginx; do
        if docker-compose ps $service | grep -q "Up (healthy)"; then
            print_status "$service container is healthy"
        elif docker-compose ps $service | grep -q "Up"; then
            print_warning "$service container is running but health check not available"
        else
            print_error "$service container is not running properly"
            containers_healthy=false
        fi
    done
    
    cd ..
    
    # Check application endpoints
    local endpoints_healthy=true
    
    # Backend health
    for i in {1..10}; do
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            print_status "Backend API is responding"
            break
        elif [ $i -eq 10 ]; then
            print_error "Backend API is not responding after 10 attempts"
            endpoints_healthy=false
        else
            print_info "Backend health check attempt $i/10..."
            sleep 5
        fi
    done
    
    # Frontend check
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is responding"
    else
        print_error "Frontend is not responding"
        endpoints_healthy=false
    fi
    
    if [ "$containers_healthy" = true ] && [ "$endpoints_healthy" = true ]; then
        print_status "All Docker services are healthy"
        return 0
    else
        print_error "Some Docker services are unhealthy"
        return 1
    fi
}

# Function to show Docker container status
docker_status() {
    print_info "Docker Container Status:"
    cd docker
    docker-compose ps
    echo ""
    print_info "Docker Container Resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    cd ..
}

# Function to fix dependencies and security issues
fix_dependencies() {
    print_info "Fixing dependencies and security issues..."
    
    # Update npm to latest
    npm install -g npm@latest
    
    # Frontend fixes
    print_info "Fixing frontend dependencies..."
    npm audit fix --force
    npm update
    
    # Backend fixes
    print_info "Fixing backend dependencies..."
    cd backend
    npm audit fix --force
    npm update
    cd ..
    
    print_status "Dependencies and security issues fixed"
}

# Function to clean build cache
clean_build_cache() {
    print_info "Cleaning build cache..."
    
    if [ -f "scripts/clean-build.sh" ]; then
        chmod +x scripts/clean-build.sh
        ./scripts/clean-build.sh
    else
        # Manual cache clean
        print_info "Cleaning frontend cache..."
        rm -rf node_modules/.cache dist .vite
        
        print_info "Cleaning backend cache..."
        cd backend
        rm -rf node_modules/.cache dist .tsc-cache
        cd ..
    fi
    
    print_status "Build cache cleaned"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --force-reset)
            FORCE_RESET=true
            shift
            ;;
        --no-demo-users)
            ENABLE_DEMO_USERS=false
            shift
            ;;
        --environment)
            MODE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            COMMAND=$1
            shift
            ;;
    esac
done

# Initialize logging
mkdir -p "$LOG_DIR"
log_message "INFO" "Deployment script started with command: ${COMMAND:-menu}"

# Main script logic
case "${COMMAND:-menu}" in
    menu)
        show_menu
        ;;
    dev)
        MODE="dev"
        deploy_dev
        ;;
    prod)
        MODE="prod"
        deploy_prod
        ;;
    build)
        check_prerequisites
        build_application
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    health)
        check_health
        ;;
    db-setup)
        setup_database
        ;;
    db-reset)
        reset_database
        ;;
    backup)
        backup_database
        ;;
    rollback)
        rollback_database
        ;;
    demo-users)
        create_demo_users
        ;;
    clean)
        cleanup
        ;;
    *)
        log_message "ERROR" "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac