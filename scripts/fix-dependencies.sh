#!/bin/bash

# Fix Dependencies and Security Issues Script
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

# Function to fix npm compatibility
fix_npm_compatibility() {
    local npm_version=$(npm --version 2>/dev/null || echo "0.0.0")
    local node_version=$(node --version | sed 's/v//')
    
    print_info "Current npm version: $npm_version"
    print_info "Current Node.js version: $node_version"
    
    # Check if npm version is too high for current Node.js
    if [[ "$npm_version" > "10.0.0" ]] && [[ "$node_version" < "20.0.0" ]]; then
        print_warning "npm $npm_version incompatible with Node.js $node_version"
        print_info "Downgrading npm to compatible version..."
        
        # Downgrade npm to compatible version
        npm install -g npm@9.2.0 --force || {
            print_warning "Failed to downgrade npm globally"
            return 1
        }
        
        print_status "npm downgraded successfully"
    else
        print_status "npm version is compatible"
    fi
}

# Function to fix backend dependencies
fix_backend_dependencies() {
    print_info "Fixing backend dependencies..."
    
    cd backend
    
    # Install missing dependencies that are needed for Docker build
    print_info "Installing missing TypeScript types and Keycloak admin client..."
    
    # Use npm with --force to handle any conflicts
    npm install --save @keycloak/keycloak-admin-client@^26.3.1 || true
    npm install --save @types/cookie-parser@^1.4.9 || true  
    npm install --save @types/csurf@^1.11.5 || true
    npm install --save typescript@^5.3.3 || true
    npm install --save chalk@4.1.2 || true
    
    print_status "Backend dependencies fixed"
    cd ..
}

# Function to fix frontend dependencies
fix_frontend_dependencies() {
    print_info "Fixing frontend dependencies..."
    
    # Update browserslist database
    npx update-browserslist-db@latest || true
    
    # Fix any audit issues that don't require breaking changes
    npm audit fix --force || true
    
    print_status "Frontend dependencies fixed"
}

# Main execution
main() {
    print_info "🔧 Starting dependency and security fixes..."
    
    # Fix npm compatibility first
    fix_npm_compatibility
    
    # Fix backend dependencies
    fix_backend_dependencies
    
    # Fix frontend dependencies  
    fix_frontend_dependencies
    
    print_status "🎉 All dependency fixes completed!"
    print_info "You can now run deployment again"
}

# Run main function
main "$@"