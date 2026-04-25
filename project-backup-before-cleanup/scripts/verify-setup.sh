#!/bin/bash

# Verify Complete Setup
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

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

echo "🔍 Verifying My School Buddies Setup..."

# Check backend dependencies
print_info "Checking backend dependencies..."
if [ -f "backend/package-lock.json" ] && [ -d "backend/node_modules" ]; then
    print_status "Backend dependencies OK"
else
    print_warning "Backend dependencies need installation"
    print_info "Run: ./scripts/fix-backend-deps.sh"
fi

# Check environment files
print_info "Checking environment configuration..."
if [ -f "backend/.env" ] && [ -f ".env" ]; then
    print_status "Environment files OK"
else
    print_error "Missing environment files"
    exit 1
fi

# Check if backend is running
print_info "Checking if backend is running..."
if curl -s http://localhost:3033/health > /dev/null 2>&1; then
    print_status "Backend is running on port 3033"
else
    print_warning "Backend is not running"
    print_info "Start with: ./scripts/start-backend.sh"
fi

# Check frontend environment
print_info "Checking frontend environment..."
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    print_status "Frontend dependencies OK"
else
    print_warning "Frontend dependencies need installation"
    print_info "Run: npm install"
fi

echo ""
print_status "Setup verification complete!"
print_info "To start the application:"
print_info "1. Backend: ./scripts/start-backend.sh"
print_info "2. Frontend: npm run dev"
print_info "3. Test registration: node scripts/test-registration.js"