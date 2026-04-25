#!/bin/bash

# Fix Prisma Client Generation Script
set -e

# Make script executable
chmod +x "$0"

print_status() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_info "Fixing Prisma client issues..."

cd backend

# Remove old Prisma client and generated files
print_info "Cleaning old Prisma client..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf prisma/generated

# Reinstall Prisma dependencies
print_info "Reinstalling Prisma dependencies..."
npm install @prisma/client prisma --save

# Format Prisma schema
print_info "Formatting Prisma schema..."
npx prisma format

# Generate fresh Prisma client
print_info "Generating fresh Prisma client..."
npx prisma generate

# Test build
print_info "Testing TypeScript build..."
npm run build

print_status "Prisma client fixed successfully!"
print_info "Backend is ready to start"

cd ..