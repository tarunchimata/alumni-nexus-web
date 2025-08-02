
#!/bin/bash

# Keycloak Setup Script for My School Buddies
# This script sets up the Keycloak realm and clients using the new deployment script

set -e

# Configuration
KEYCLOAK_URL="https://login.hostingmanager.in"
KEYCLOAK_REALM="myschoolbuddies-realm"
ADMIN_USER="admin"
ADMIN_PASSWORD="S@feAdminKeycloak!2025"

echo "🚀 Setting up Keycloak for My School Buddies..."

# Check if Keycloak is accessible
echo "📡 Checking Keycloak connectivity..."
if ! curl -s "$KEYCLOAK_URL/realms/master" > /dev/null; then
    echo "❌ Error: Cannot connect to Keycloak at $KEYCLOAK_URL"
    exit 1
fi

echo "✅ Keycloak is accessible"

# Get admin access token
echo "🔐 Obtaining admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASSWORD" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | \
    python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || \
    node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).access_token)" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Error: Failed to obtain admin token"
    echo "Please check your admin credentials and try again"
    exit 1
fi

echo "✅ Admin token obtained"

# Export the admin token for the deployment script
export ADMIN_TOKEN

# Set default environment variables for deployment
export KEYCLOAK_URL="$KEYCLOAK_URL"
export KEYCLOAK_REALM_NAME="myschoolbuddies-realm"
export KEYCLOAK_REALM_DISPLAY_NAME="My School Buddies"
export KEYCLOAK_SMTP_HOST="smtp.sendgrid.net"
export KEYCLOAK_SMTP_PORT="587"
export KEYCLOAK_SMTP_FROM="noreply@myschoolbuddies.com"
export KEYCLOAK_SMTP_FROM_DISPLAY_NAME="My School Buddies"
export KEYCLOAK_SMTP_SSL="false"
export KEYCLOAK_SMTP_STARTTLS="true"
export KEYCLOAK_SMTP_AUTH="true"
export KEYCLOAK_SMTP_USER="apikey"
export KEYCLOAK_SMTP_PASSWORD="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"
export KEYCLOAK_FRONTEND_REDIRECT_URIS='["http://localhost:3000/*","https://myschoolbuddies.com/*"]'
export KEYCLOAK_FRONTEND_WEB_ORIGINS='["http://localhost:3000","https://myschoolbuddies.com"]'
export KEYCLOAK_FRONTEND_POST_LOGOUT_URIS="http://localhost:3000/*##https://myschoolbuddies.com/*"
export KEYCLOAK_BACKEND_CLIENT_SECRET="backend-client-secret-2025"
export KEYCLOAK_ADMIN_USERNAME="admin@myschoolbuddies.com"
export KEYCLOAK_ADMIN_EMAIL="admin@myschoolbuddies.com"
export KEYCLOAK_ADMIN_FIRST_NAME="Platform"
export KEYCLOAK_ADMIN_LAST_NAME="Admin"
export KEYCLOAK_ADMIN_PASSWORD="Admin@123"
export KEYCLOAK_FRONTEND_URL="https://login.hostingmanager.in"
export KEYCLOAK_ADMIN_URL="https://login.hostingmanager.in"

# Run the deployment script
echo "🚀 Running Keycloak realm deployment..."
chmod +x scripts/deploy-keycloak-realm.sh
./scripts/deploy-keycloak-realm.sh

echo ""
echo "🎉 Keycloak setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "   Realm: $KEYCLOAK_REALM"
echo "   URL: $KEYCLOAK_URL"
echo "   Admin Console: $KEYCLOAK_URL/admin/"
echo ""
echo "🔑 Default Admin User:"
echo "   Username: admin@myschoolbuddies.com"
echo "   Password: Admin@123"
echo ""
echo "📱 Client IDs created:"
echo "   Frontend: myschoolbuddies-client (Public, PKCE enabled)"
echo "   Backend: myschoolbuddies-backend-client (Confidential)"
echo ""
echo "👥 Roles created:"
echo "   - platform_admin"
echo "   - school_admin" 
echo "   - teacher"
echo "   - student"
echo "   - alumni"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Test the frontend authentication at http://localhost:3000"
echo "   2. Verify backend API authentication with the new client ID"
echo "   3. Configure your backend environment with the new client settings"
echo "   4. Update frontend configuration with the new client ID"
