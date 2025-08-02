#!/bin/bash

# Keycloak Configuration Validation Script
set -e

# Load environment variables
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
elif [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ No environment file found"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️]${NC} $1"
}

echo "=================================================="
echo "🔐 Keycloak Configuration Validation"
echo "=================================================="

# Check required environment variables
print_status "Checking environment variables..."

REQUIRED_VARS=(
    "VITE_KEYCLOAK_URL"
    "VITE_KEYCLOAK_REALM"
    "VITE_KEYCLOAK_CLIENT_ID"
    "VITE_OAUTH2_REDIRECT_URI"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Missing required environment variable: $var"
        exit 1
    else
        print_success "$var = ${!var}"
    fi
done

# Test Keycloak server connectivity
print_status "Testing Keycloak server connectivity..."
KEYCLOAK_HEALTH_URL="${VITE_KEYCLOAK_URL}/health"

if curl -s --connect-timeout 10 "$KEYCLOAK_HEALTH_URL" > /dev/null; then
    print_success "Keycloak server is accessible at $VITE_KEYCLOAK_URL"
else
    print_error "Cannot connect to Keycloak server at $VITE_KEYCLOAK_URL"
    print_warning "This may be expected if Keycloak is not running or network is restricted"
fi

# Test realm configuration
print_status "Testing realm configuration..."
REALM_URL="${VITE_KEYCLOAK_URL}/realms/${VITE_KEYCLOAK_REALM}"

if curl -s --connect-timeout 10 "$REALM_URL" > /dev/null; then
    print_success "Realm '$VITE_KEYCLOAK_REALM' is accessible"
else
    print_error "Cannot access realm '$VITE_KEYCLOAK_REALM'"
    print_warning "Verify that the realm exists and is properly configured"
fi

# Test OIDC configuration
print_status "Testing OIDC configuration..."
OIDC_CONFIG_URL="${VITE_KEYCLOAK_URL}/realms/${VITE_KEYCLOAK_REALM}/.well-known/openid_configuration"

if OIDC_CONFIG=$(curl -s --connect-timeout 10 "$OIDC_CONFIG_URL" 2>/dev/null); then
    print_success "OIDC configuration is accessible"
    
    # Extract and validate endpoints
    AUTH_ENDPOINT=$(echo "$OIDC_CONFIG" | grep -o '"authorization_endpoint":"[^"]*"' | cut -d'"' -f4)
    TOKEN_ENDPOINT=$(echo "$OIDC_CONFIG" | grep -o '"token_endpoint":"[^"]*"' | cut -d'"' -f4)
    USERINFO_ENDPOINT=$(echo "$OIDC_CONFIG" | grep -o '"userinfo_endpoint":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$AUTH_ENDPOINT" ]; then
        print_success "Authorization endpoint: $AUTH_ENDPOINT"
    else
        print_error "Authorization endpoint not found in OIDC configuration"
    fi
    
    if [ -n "$TOKEN_ENDPOINT" ]; then
        print_success "Token endpoint: $TOKEN_ENDPOINT"
    else
        print_error "Token endpoint not found in OIDC configuration"
    fi
    
    if [ -n "$USERINFO_ENDPOINT" ]; then
        print_success "User info endpoint: $USERINFO_ENDPOINT"
    else
        print_error "User info endpoint not found in OIDC configuration"
    fi
else
    print_error "Cannot access OIDC configuration"
    print_warning "Verify that Keycloak is properly configured and accessible"
fi

# Validate redirect URI format
print_status "Validating redirect URI format..."
if [[ "$VITE_OAUTH2_REDIRECT_URI" =~ ^https?://[^/]+/oauth2/callback$ ]]; then
    print_success "Redirect URI format is valid: $VITE_OAUTH2_REDIRECT_URI"
else
    print_error "Invalid redirect URI format: $VITE_OAUTH2_REDIRECT_URI"
    print_warning "Expected format: https://domain.com/oauth2/callback"
fi

# Check if running in production
if [[ "$VITE_OAUTH2_REDIRECT_URI" == *"localhost"* ]]; then
    print_warning "Using localhost redirect URI - this appears to be development configuration"
else
    print_success "Using production redirect URI"
fi

echo ""
echo "=================================================="
echo "📋 Keycloak Client Configuration Checklist"
echo "=================================================="
echo "Verify the following in Keycloak Admin Console:"
echo ""
echo "1. Client ID: $VITE_KEYCLOAK_CLIENT_ID"
echo "   - Client Type: OpenID Connect"
echo "   - Access Type: public"
echo "   - Standard Flow Enabled: ON"
echo "   - Direct Access Grants Enabled: OFF"
echo ""
echo "2. Valid Redirect URIs:"
echo "   - $VITE_OAUTH2_REDIRECT_URI"
echo ""
echo "3. Web Origins:"
echo "   - ${VITE_OAUTH2_REDIRECT_URI%/oauth2/callback}"
echo ""
echo "4. Client Roles (if using client-level roles):"
echo "   - platform_admin"
echo "   - school_admin"
echo "   - teacher"
echo "   - student"
echo "   - alumni"
echo ""
echo "5. Realm Roles (if using realm-level roles):"
echo "   - platform_admin"
echo "   - school_admin"
echo "   - teacher"
echo "   - student"
echo "   - alumni"
echo ""
echo "=================================================="

# Test OAuth2 Authorization URL generation
print_status "Testing OAuth2 authorization URL generation..."
AUTH_URL="${VITE_KEYCLOAK_URL}/realms/${VITE_KEYCLOAK_REALM}/protocol/openid-connect/auth"
CLIENT_ID="${VITE_KEYCLOAK_CLIENT_ID}"
REDIRECT_URI="${VITE_OAUTH2_REDIRECT_URI}"
SCOPE="openid profile email"

# Generate a test authorization URL
TEST_AUTH_URL="${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&state=test"

print_success "Test authorization URL generated:"
echo "   $TEST_AUTH_URL"
print_warning "You can test this URL manually in a browser to verify the OAuth2 flow"

echo ""
print_success "Keycloak validation completed!"
print_status "If all checks pass, your Keycloak configuration should be ready for production"