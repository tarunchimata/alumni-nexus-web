#!/bin/bash

# 🚀 Alumni Nexus Web - Quick Setup Script
# This script sets up the project locally with minimal configuration

set -e  # Exit on any error

echo "🎉 Alumni Nexus Web - Quick Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is required but not installed."
        exit 1
    fi
    
    print_status "All requirements satisfied!"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Created .env from template"
            print_warning "Please edit .env file with your database credentials"
        else
            print_error ".env.example not found!"
            exit 1
        fi
    else
        print_status ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing frontend dependencies..."
    npm install
    print_status "Frontend dependencies installed"
    
    print_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_status "Backend dependencies installed"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    cd backend
    
    # Generate Prisma client
    npx prisma generate
    print_status "Prisma client generated"
    
    # Push database schema
    npx prisma db push
    print_status "Database schema pushed"
    
    cd ..
}

# Start services
start_services() {
    print_info "Starting services..."
    
    # Check if Docker is available
    if command -v docker-compose &> /dev/null; then
        print_info "Starting with Docker Compose..."
        docker-compose up --build
    else
        print_warning "Docker not found. Starting manually..."
        
        # Start backend in background
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        # Wait a moment for backend to start
        sleep 3
        
        # Start frontend
        npm run dev &
        FRONTEND_PID=$!
        
        print_status "Services started!"
        print_info "Backend PID: $BACKEND_PID"
        print_info "Frontend PID: $FRONTEND_PID"
        print_info "Press Ctrl+C to stop services"
        
        # Wait for user to stop
        wait
    fi
}

# Main execution
main() {
    print_info "Starting Alumni Nexus Web setup..."
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    
    echo ""
    print_status "Setup completed! 🎉"
    echo ""
    print_info "Access URLs:"
    print_info "  Frontend: http://localhost:5173 (dev) or http://localhost:8080 (docker)"
    print_info "  Backend:  http://localhost:3033/api"
    print_info "  Health:   http://localhost:3033/api/health"
    echo ""
    print_info "Login with any role: student, teacher, alumni, school_admin, platform_admin"
    echo ""
    
    # Ask user if they want to start services
    read -p "Do you want to start the services now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
    else
        print_info "Setup complete! Run 'npm run dev' to start manually."
    fi
}

# Run main function
main "$@"
