#!/bin/bash

# ==================================================
# My School Buddies - Professional Testing Script
# ==================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="My School Buddies"
DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
LOG_DIR="$DOCKER_DIR/logs"
TEST_REPORT="$LOG_DIR/test-report-$(date +%Y%m%d-%H%M%S).log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$TEST_REPORT"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$TEST_REPORT"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$TEST_REPORT"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$TEST_REPORT"
}

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
test_passed() {
    log "✅ $1 - PASSED"
    ((TESTS_PASSED++))
}

test_failed() {
    error "❌ $1 - FAILED"
    ((TESTS_FAILED++))
}

test_warning() {
    warning "⚠️ $1 - WARNING"
}

# Test functions
test_database_connection() {
    info "Testing Database Connection..."
    
    cd "$DOCKER_DIR/../backend"
    
    if npx prisma db pull --force > /dev/null 2>&1; then
        test_passed "Database Connection"
    else
        test_failed "Database Connection"
    fi
}

test_backend_health_api() {
    info "Testing Backend Health API..."
    
    if curl -s -f http://localhost:3033/health > /dev/null 2>&1; then
        test_passed "Backend Health API"
    else
        test_failed "Backend Health API"
    fi
}

test_frontend_availability() {
    info "Testing Frontend Availability..."
    
    if curl -s -f http://localhost:8080 > /dev/null 2>&1; then
        test_passed "Frontend Availability"
    else
        test_failed "Frontend Availability"
    fi
}

test_keycloak_authentication() {
    info "Testing Keycloak Authentication..."
    
    # Test Keycloak server availability
    if curl -s -f https://login.hostingmanager.in/realms/myschoolbuddies-realm/.well-known/openid_configuration > /dev/null 2>&1; then
        test_passed "Keycloak Authentication Server"
    else
        test_failed "Keycloak Authentication Server"
    fi
    
    # Test backend OAuth2 configuration
    if curl -s http://localhost:3033/health | grep -q "keycloak.*configured.*true" > /dev/null 2>&1; then
        test_passed "Backend Keycloak Integration"
    else
        test_failed "Backend Keycloak Integration"
    fi
}

test_school_search_api() {
    info "Testing School Search API..."
    
    # Test API endpoint exists (should return auth error for unauthenticated)
    if curl -s -f "http://localhost:3033/api/schools/search?query=test" 2>&1 | grep -q "access token" > /dev/null 2>&1; then
        test_passed "School Search API Security"
    else
        test_failed "School Search API Security"
    fi
}

test_alumni_registration_flow() {
    info "Testing Alumni Registration Flow..."
    
    # Test registration endpoint exists
    if curl -s -f http://localhost:3033/api/auth/register > /dev/null 2>&1; then
        test_passed "Registration Endpoint Available"
    else
        test_warning "Registration Endpoint (may require authentication)"
    fi
    
    # Test multi-step registration
    if curl -s -f http://localhost:3033/health | grep -q "multiStepRegistration.*true" > /dev/null 2>&1; then
        test_passed "Multi-Step Registration Enabled"
    else
        test_failed "Multi-Step Registration"
    fi
}

test_admin_approval_flow() {
    info "Testing Admin Approval Flow..."
    
    # Check if approval system is enabled
    if curl -s http://localhost:3033/health | grep -q "features" > /dev/null 2>&1; then
        test_passed "Approval System Features"
    else
        test_warning "Approval System Features (health endpoint format)"
    fi
}

test_csv_upload() {
    info "Testing CSV Upload Functionality..."
    
    # Test CSV endpoint exists
    if curl -s -f http://localhost:3033/api/csv > /dev/null 2>&1; then
        test_passed "CSV Upload Endpoint"
    else
        test_warning "CSV Upload Endpoint (may require authentication)"
    fi
    
    # Check bulk upload feature
    if curl -s http://localhost:3033/health | grep -q "bulk.*upload" > /dev/null 2>&1; then
        test_passed "Bulk Upload Feature"
    else
        test_warning "Bulk Upload Feature"
    fi
}

test_docker_container_health() {
    info "Testing Docker Container Health..."
    
    cd "$DOCKER_DIR"
    
    # Check if containers are running
    if docker compose ps | grep -q "Up" > /dev/null 2>&1; then
        test_passed "Docker Containers Running"
    else
        test_failed "Docker Containers Running"
    fi
    
    # Check container health status
    if docker compose ps | grep -q "healthy" > /dev/null 2>&1; then
        test_passed "Docker Container Health"
    else
        test_warning "Docker Container Health (may be starting)"
    fi
}

test_full_end_to_end_validation() {
    info "Running Full End-to-End Validation..."
    
    # Test complete flow: Frontend -> Backend -> Database
    local frontend_ok=false
    local backend_ok=false
    local db_ok=false
    
    # Check frontend
    if curl -s -f http://localhost:8080 > /dev/null 2>&1; then
        frontend_ok=true
    fi
    
    # Check backend
    if curl -s -f http://localhost:3033/health > /dev/null 2>&1; then
        backend_ok=true
    fi
    
    # Check database
    if cd "$DOCKER_DIR/../backend" && npx prisma db pull --force > /dev/null 2>&1; then
        db_ok=true
    fi
    
    if [[ "$frontend_ok" == true && "$backend_ok" == true && "$db_ok" == true ]]; then
        test_passed "Full End-to-End Validation"
    else
        test_failed "Full End-to-End Validation"
        info "Frontend: $frontend_ok, Backend: $backend_ok, Database: $db_ok"
    fi
}

generate_test_report() {
    info "Generating Test Report..."
    
    {
        echo "=================================================="
        echo "   $PROJECT_NAME - Test Report"
        echo "=================================================="
        echo "Test Date: $(date)"
        echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
        echo "Tests Passed: $TESTS_PASSED"
        echo "Tests Failed: $TESTS_FAILED"
        echo "Success Rate: $(( TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED) ))%"
        echo "=================================================="
        echo
        echo "Detailed results saved in: $TEST_REPORT"
    } | tee -a "$TEST_REPORT"
    
    log "✅ Test report generated: $TEST_REPORT"
}

# Main menu
show_menu() {
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}   $PROJECT_NAME - Testing Menu${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo
    echo "1. Test Database Connection"
    echo "2. Test Backend Health API"
    echo "3. Test Frontend Availability"
    echo "4. Test Keycloak Authentication"
    echo "5. Test School Search API"
    echo "6. Test Alumni Registration Flow"
    echo "7. Test Admin Approval Flow"
    echo "8. Test CSV Upload"
    echo "9. Test Docker Container Health"
    echo "10. Full End-to-End Validation"
    echo "11. Generate Test Report"
    echo "12. Exit"
    echo
    echo -e "${BLUE}Current Directory: $DOCKER_DIR${NC}"
    echo -e "${BLUE}Log Directory: $LOG_DIR${NC}"
    echo
}

# Main execution
main() {
    cd "$DOCKER_DIR"
    
    # Initialize test report
    {
        echo "My School Buddies - Test Session Started: $(date)"
        echo "=================================================="
    } > "$TEST_REPORT"
    
    while true; do
        show_menu
        read -p "Please select an option (1-12): " choice
        
        case $choice in
            1)
                test_database_connection
                ;;
            2)
                test_backend_health_api
                ;;
            3)
                test_frontend_availability
                ;;
            4)
                test_keycloak_authentication
                ;;
            5)
                test_school_search_api
                ;;
            6)
                test_alumni_registration_flow
                ;;
            7)
                test_admin_approval_flow
                ;;
            8)
                test_csv_upload
                ;;
            9)
                test_docker_container_health
                ;;
            10)
                test_full_end_to_end_validation
                ;;
            11)
                generate_test_report
                ;;
            12)
                log "Exiting testing script..."
                exit 0
                ;;
            *)
                error "Invalid option. Please select 1-12."
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker first."
    exit 1
fi

# Run main function
main "$@"
