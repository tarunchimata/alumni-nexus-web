#!/bin/bash

# Backend Local Testing Script
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

# Check if script is run from project root
if [ ! -f "backend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "🧪 Testing My School Buddies Backend Locally"
echo "=================================================="

# Navigate to backend directory
cd backend

# 1. Check environment file
print_info "1. Checking environment configuration..."
if [ -f ".env.local" ]; then
    print_status "Found .env.local"
    ENV_FILE=".env.local"
elif [ -f ".env.production" ]; then
    print_status "Found .env.production"
    ENV_FILE=".env.production"
elif [ -f ".env" ]; then
    print_status "Found .env"
    ENV_FILE=".env"
else
    print_error "No environment file found. Please create .env.local"
    exit 1
fi

# 2. Check required directories
print_info "2. Checking required directories..."
for dir in "logs" "uploads"; do
    if [ ! -d "$dir" ]; then
        print_info "Creating directory: $dir"
        mkdir -p "$dir"
    else
        print_status "Directory exists: $dir"
    fi
done

# 3. Check dependencies
print_info "3. Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies found"
fi

# 4. Generate Prisma client
print_info "4. Generating Prisma client..."
if npx prisma generate; then
    print_status "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# 5. Test database connection (optional)
print_info "5. Testing database connection..."
if command -v psql &> /dev/null; then
    # Load environment variables
    export $(grep -v '^#' $ENV_FILE | xargs)
    
    if psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        print_status "Database connection successful"
    else
        print_warning "Database connection failed (backend may still start)"
    fi
else
    print_warning "psql not available, skipping database test"
fi

# 6. Check for port conflicts
print_info "6. Checking for port conflicts..."
PORT=${PORT:-3001}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
    print_error "Port $PORT is already in use. Please stop the process or change PORT in $ENV_FILE"
    print_info "To find the process: lsof -Pi :$PORT -sTCP:LISTEN"
    exit 1
else
    print_status "Port $PORT is available"
fi

# 7. Build test (for production mode)
print_info "7. Testing TypeScript compilation..."
if npm run build; then
    print_status "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

print_status "🎉 Backend local testing completed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Start development mode: npm run dev"
echo "  2. Start production mode: npm start"
echo "  3. Start with debug logging: node ../scripts/start-backend-debug.js"
echo ""
print_info "Health check URL: http://localhost:$PORT/health"
print_info "API base URL: http://localhost:$PORT/api"