#!/bin/bash

# My School Buddies - Local Full Stack Startup Script
# This script starts both backend and frontend for local development testing

set -e

echo "🚀 Starting My School Buddies - Local Development Mode"
echo "=================================================="

# Color functions for better output
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }

# Check if we're in the project root
if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Kill any existing processes on our ports
print_info "Cleaning up existing processes..."
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "vite.*8080" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Check for required environment files
if [[ ! -f ".env.local" ]]; then
    print_warning "Frontend .env.local not found - creating from template"
    cp .env.example .env.local 2>/dev/null || print_error "No .env.example found"
fi

if [[ ! -f "backend/.env.local" ]]; then
    print_error "Backend .env.local not found - please create it first"
    exit 1
fi

# Start backend
print_info "Starting backend on port 3001..."
cd backend

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_info "Installing backend dependencies..."
    npm install
fi

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate

# Start backend in background
print_info "Launching backend server..."
npm run dev > ../logs/backend-local.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start and check health
print_info "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend is healthy at http://localhost:3001"
        break
    fi
    if [[ $i -eq 30 ]]; then
        print_error "Backend failed to start after 30 seconds"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start frontend
cd ..
print_info "Starting frontend on port 8080..."

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_info "Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
print_info "Launching frontend server..."
npm run dev > logs/frontend-local.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
print_info "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        print_success "Frontend is running at http://localhost:8080"
        break
    fi
    if [[ $i -eq 30 ]]; then
        print_error "Frontend failed to start after 30 seconds"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Validation checks
echo ""
echo "🔍 VALIDATION CHECKS"
echo "===================="

# Backend health check
if curl -s http://localhost:3001/health | grep -q "OK"; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
fi

# OAuth2 config check
if curl -s http://localhost:3001/api/oauth2/config > /dev/null; then
    print_success "OAuth2 configuration accessible"
else
    print_error "OAuth2 configuration not accessible"
fi

# Keycloak discovery URL check
if curl -s "https://login.hostingmanager.in/realms/myschoolbuddies-realm/.well-known/openid-configuration" > /dev/null; then
    print_success "Keycloak discovery URL is reachable"
else
    print_error "Keycloak discovery URL is NOT reachable"
fi

echo ""
echo "🎉 LOCAL DEVELOPMENT ENVIRONMENT READY"
echo "======================================"
print_success "Backend: http://localhost:3001"
print_success "Frontend: http://localhost:8080"
print_success "Health Check: curl http://localhost:3001/health"
print_success "OAuth2 Config: curl http://localhost:3001/api/oauth2/config"
print_success "Logs: tail -f logs/backend-local.log logs/frontend-local.log"

echo ""
print_info "Test Credentials:"
print_info "Email: admin@myschoolbuddies.com"
print_info "Password: S@feAdminKeycloak!2025"

echo ""
print_warning "Press Ctrl+C to stop both servers"

# Create cleanup function
cleanup() {
    echo ""
    print_info "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    print_success "Servers stopped successfully"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID