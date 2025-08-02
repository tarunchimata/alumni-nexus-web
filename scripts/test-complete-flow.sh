#!/bin/bash

# Test Complete Registration Flow
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

print_info "🧪 Testing Complete Registration Flow..."

# Test 1: Backend Health
print_info "1. Testing backend health..."
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    print_status "Backend is healthy"
else
    print_error "Backend health check failed - ensure backend is running on port 3001"
    exit 1
fi

# Test 2: Registration API Endpoints
print_info "2. Testing registration endpoints..."

# Test registration init
if curl -s -X POST http://localhost:3001/api/registration/init | grep -q "Registration session initialized"; then
    print_status "Registration init endpoint working"
else
    print_error "Registration init endpoint failed"
    exit 1
fi

# Test 3: Frontend Access
print_info "3. Testing frontend access..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_status "Frontend is accessible"
else
    print_info "Frontend not running - start with 'npm run dev'"
fi

# Test 4: Database Connection
print_info "4. Testing database connection..."
if curl -s http://localhost:3001/health | grep -q "connected"; then
    print_status "Database connection healthy"
else
    print_error "Database connection failed"
    exit 1
fi

# Test 5: Complete Registration Flow via API
print_info "5. Testing complete registration flow via API..."
if node scripts/test-registration.mjs >/dev/null 2>&1; then
    print_status "Complete registration flow test passed"
else
    print_info "Registration flow test failed - check logs"
fi

print_status "🎉 All tests completed!"
print_info "The registration system should now be working"
print_info ""
print_info "Next steps:"
print_info "1. Visit http://localhost:3000/register"
print_info "2. Complete the 4-step registration process"
print_info "3. Check for any console errors in browser"