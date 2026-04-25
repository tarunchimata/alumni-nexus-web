#!/bin/bash

# Fix Backend Dependencies Script
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

cd backend

print_info "Fixing backend dependencies..."

# Remove existing lock file and node_modules
print_info "Cleaning existing dependencies..."
rm -rf package-lock.json node_modules

# Install dependencies fresh
print_info "Installing dependencies fresh..."
npm install

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate

# Test build
print_info "Testing build..."
npm run build

print_status "Backend dependencies fixed successfully!"
print_info "Backend is ready to start"