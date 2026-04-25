#!/bin/bash

# Alumni Nexus Web - Docker Setup Script
# This script helps set up and run the application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running"
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose first."
        exit 1
    fi
    print_status "docker-compose is available"
}

# Function to setup environment files
setup_env() {
    print_info "Setting up environment files..."
    
    if [ ! -f ./backend/.env ]; then
        if [ -f ./backend/.env.example ]; then
            cp ./backend/.env.example ./backend/.env
            print_status "Created backend/.env from example"
        else
            print_error "backend/.env.example not found!"
            exit 1
        fi
    else
        print_status "backend/.env already exists"
    fi
    
    # Check for required environment variables
    if ! grep -q "SCHOOLS_API_URL" ./backend/.env; then
        print_warning "Adding external API configuration to .env..."
        cat >> ./backend/.env << EOF

# External API Configuration
SCHOOLS_API_URL=https://api.hostingmanager.in/api/schools/all
USERS_API_URL=https://api.hostingmanager.in/api/users/all
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Docker Configuration
REDIS_PASSWORD=default123
GRAFANA_PASSWORD=admin123
EOF
        print_status "Added external API configuration"
    fi
}

# Function to build and start services
start_services() {
    local mode=$1
    
    if [ "$mode" = "development" ]; then
        print_info "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up --build
    elif [ "$mode" = "production" ]; then
        print_info "Starting production environment..."
        docker-compose -f docker-compose.production.yml up --build -d
        print_status "Services started in background"
        print_info "Frontend: http://localhost:8080"
        print_info "Backend API: http://localhost:3033/api"
        print_info "Grafana (monitoring): http://localhost:3000"
        print_info "Prometheus: http://localhost:9090"
    else
        print_error "Invalid mode. Use 'development' or 'production'"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    local mode=$1
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml down
    elif [ "$mode" = "production" ]; then
        docker-compose -f docker-compose.production.yml down
    else
        print_error "Invalid mode. Use 'development' or 'production'"
        exit 1
    fi
    print_status "Services stopped"
}

# Function to show logs
show_logs() {
    local mode=$1
    local service=$2
    
    if [ "$mode" = "development" ]; then
        if [ -n "$service" ]; then
            docker-compose -f docker-compose.dev.yml logs -f "$service"
        else
            docker-compose -f docker-compose.dev.yml logs -f
        fi
    elif [ "$mode" = "production" ]; then
        if [ -n "$service" ]; then
            docker-compose -f docker-compose.production.yml logs -f "$service"
        else
            docker-compose -f docker-compose.production.yml logs -f
        fi
    else
        print_error "Invalid mode. Use 'development' or 'production'"
        exit 1
    fi
}

# Function to clean up
cleanup() {
    local mode=$1
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml down -v
    elif [ "$mode" = "production" ]; then
        docker-compose -f docker-compose.production.yml down -v
    else
        print_error "Invalid mode. Use 'development' or 'production'"
        exit 1
    fi
    
    # Remove unused images and containers
    docker system prune -f
    print_status "Cleanup completed"
}

# Function to show status
show_status() {
    local mode=$1
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml ps
    elif [ "$mode" = "production" ]; then
        docker-compose -f docker-compose.production.yml ps
    else
        print_error "Invalid mode. Use 'development' or 'production'"
        exit 1
    fi
}

# Function to health check
health_check() {
    local mode=$1
    
    print_info "Performing health checks..."
    
    if [ "$mode" = "development" ]; then
        # Check backend
        if curl -s http://localhost:3033/api/health > /dev/null; then
            print_status "Backend is healthy"
        else
            print_error "Backend is not responding"
        fi
        
        # Check frontend
        if curl -s http://localhost:5173 > /dev/null; then
            print_status "Frontend is healthy"
        else
            print_error "Frontend is not responding"
        fi
        
    elif [ "$mode" = "production" ]; then
        # Check backend
        if curl -s http://localhost:3033/api/health > /dev/null; then
            print_status "Backend is healthy"
        else
            print_error "Backend is not responding"
        fi
        
        # Check frontend
        if curl -s http://localhost:8080/health > /dev/null; then
            print_status "Frontend is healthy"
        else
            print_error "Frontend is not responding"
        fi
        
        # Check Redis
        if docker-compose -f docker-compose.production.yml exec redis redis-cli ping > /dev/null 2>&1; then
            print_status "Redis is healthy"
        else
            print_error "Redis is not responding"
        fi
    fi
}

# Main script logic
case "$1" in
    "dev"|"development")
        check_docker
        check_docker_compose
        setup_env
        start_services "development"
        ;;
    "prod"|"production")
        check_docker
        check_docker_compose
        setup_env
        start_services "production"
        ;;
    "stop")
        if [ -z "$2" ]; then
            print_error "Please specify mode: development or production"
            exit 1
        fi
        stop_services "$2"
        ;;
    "logs")
        if [ -z "$2" ]; then
            print_error "Please specify mode: development or production"
            exit 1
        fi
        show_logs "$2" "$3"
        ;;
    "status")
        if [ -z "$2" ]; then
            print_error "Please specify mode: development or production"
            exit 1
        fi
        show_status "$2"
        ;;
    "health")
        if [ -z "$2" ]; then
            print_error "Please specify mode: development or production"
            exit 1
        fi
        health_check "$2"
        ;;
    "cleanup")
        if [ -z "$2" ]; then
            print_error "Please specify mode: development or production"
            exit 1
        fi
        cleanup "$2"
        ;;
    *)
        echo "Alumni Nexus Web - Docker Setup Script"
        echo ""
        echo "Usage: $0 {command} [mode] [service]"
        echo ""
        echo "Commands:"
        echo "  dev|development    - Start development environment"
        echo "  prod|production    - Start production environment"
        echo "  stop [mode]        - Stop services"
        echo "  logs [mode] [service] - Show logs"
        echo "  status [mode]      - Show service status"
        echo "  health [mode]      - Perform health checks"
        echo "  cleanup [mode]     - Clean up containers and volumes"
        echo ""
        echo "Modes:"
        echo "  development        - Development environment with hot reload"
        echo "  production         - Production environment with monitoring"
        echo ""
        echo "Examples:"
        echo "  $0 dev             - Start development environment"
        echo "  $0 prod            - Start production environment"
        echo "  $0 logs dev        - Show development logs"
        echo "  $0 logs prod backend - Show production backend logs"
        echo "  $0 health prod     - Check production health"
        echo "  $0 cleanup dev     - Clean up development environment"
        exit 1
        ;;
esac
