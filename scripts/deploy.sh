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
    echo "  db-setup    Set up database schema"
    echo "  demo-users  Create demo users"
    echo "  clean       Clean up containers and volumes"
    echo ""
    echo "Options:"
    echo "  --skip-build    Skip build step"
    echo "  --skip-db       Skip database setup"
    echo "  -h, --help      Show this help message"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
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

# Function to set up database
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        print_warning "Skipping database setup"
        return
    fi
    
    print_info "Setting up database..."
    
    if [ -f "database/schema.sql" ]; then
        # Load environment variables
        set -a
        source backend/.env
        set +a
        
        print_info "Loading database schema..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/schema.sql || {
            print_warning "Schema load failed or already exists"
        }
        
        if [ -f "database/seed-data.sql" ]; then
            print_info "Loading seed data..."
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/seed-data.sql || {
                print_warning "Seed data load failed or already exists"
            }
        fi
        
        print_status "Database setup completed"
    else
        print_warning "Database schema file not found"
    fi
}

# Function to build application
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build step"
        return
    fi
    
    print_info "Building application..."
    
    # Build frontend
    print_info "Building frontend..."
    npm ci
    npm run build
    print_status "Frontend build completed"
    
    # Build backend
    print_info "Building backend..."
    cd backend
    npm ci
    npm run build
    cd ..
    print_status "Backend build completed"
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
    print_info "Checking service health..."
    
    # Check backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Backend service is healthy"
    else
        print_error "Backend service is not responding"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend service is healthy"
    else
        print_error "Frontend service is not responding"
    fi
    
    # Show running containers
    echo ""
    print_info "Running containers:"
    cd docker && docker-compose ps && cd ..
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
        echo "================================"
        echo "  My School Buddies Deployment  "
        echo "================================"
        echo ""
        echo "1. 🚀 Deploy Development Environment"
        echo "2. 🌟 Deploy Production Environment"
        echo "3. 🔨 Build Application"
        echo "4. ▶️  Start Services"
        echo "5. ⏹️  Stop Services"
        echo "6. 🔄 Restart Services"
        echo "7. 📊 Check Health"
        echo "8. 📝 Show Logs"
        echo "9. 🗄️  Setup Database"
        echo "10. 👥 Create Demo Users"
        echo "11. 🧹 Clean Up"
        echo "12. ❌ Exit"
        echo ""
        read -p "Select an option [1-12]: " choice
        
        case $choice in
            1)
                deploy_dev
                ;;
            2)
                deploy_prod
                ;;
            3)
                build_application
                ;;
            4)
                start_services
                ;;
            5)
                stop_services
                ;;
            6)
                restart_services
                ;;
            7)
                check_health
                ;;
            8)
                show_logs
                ;;
            9)
                setup_database
                ;;
            10)
                create_demo_users
                ;;
            11)
                cleanup
                ;;
            12)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
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

# Main script logic
case "${COMMAND:-menu}" in
    menu)
        show_menu
        ;;
    dev)
        deploy_dev
        ;;
    prod)
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
    demo-users)
        create_demo_users
        ;;
    clean)
        cleanup
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac