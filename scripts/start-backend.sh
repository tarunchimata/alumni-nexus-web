#!/bin/bash

# Start Backend Development Server
set -e

print_status() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_info "Starting My School Buddies Backend..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    print_info "Generating Prisma client..."
    npx prisma generate
fi

# Start the development server
print_info "Starting backend server on port 3001..."
npm run dev