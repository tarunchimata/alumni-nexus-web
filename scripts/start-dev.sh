#!/bin/bash

# Start Development Environment Script
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

print_info "🚀 Starting My School Buddies Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Start backend in background
print_info "Starting backend server..."
cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    print_info "Generating Prisma client..."
    npx prisma generate
fi

# Start backend in background
print_info "Starting backend on port 3001..."
npm run dev &
BACKEND_PID=$!

# Return to root directory
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is responding
print_info "Checking backend health..."
if curl -s http://localhost:3033/health >/dev/null 2>&1; then
    print_status "Backend is running and healthy"
else
    print_error "Backend health check failed"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend
print_info "Starting frontend on port 3000..."
print_info "You can now visit http://localhost:3000 to test the registration system"
print_info "Press Ctrl+C to stop both servers"

# Trap to kill backend when script exits
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT

# Start frontend (this will block)
npm run dev