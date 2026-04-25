
#!/usr/bin/env bash

# Keycloak Realm Deployment Script for My School Buddies
# This script deploys the Keycloak realm using environment variable substitution

set -e

echo "🚀 Starting Keycloak realm deployment..."

# Check required environment variables
REQUIRED_VARS=(
    "KEYCLOAK_URL"
    "ADMIN_TOKEN"
    "KEYCLOAK_REALM_NAME"
    "KEYCLOAK_REALM_DISPLAY_NAME"
    "KEYCLOAK_SMTP_HOST"
    "KEYCLOAK_SMTP_PORT"
    "KEYCLOAK_SMTP_FROM"
    "KEYCLOAK_SMTP_FROM_DISPLAY_NAME"
    "KEYCLOAK_SMTP_SSL"
    "KEYCLOAK_SMTP_STARTTLS"
    "KEYCLOAK_SMTP_AUTH"
    "KEYCLOAK_SMTP_USER"
    "KEYCLOAK_SMTP_PASSWORD"
    "KEYCLOAK_FRONTEND_REDIRECT_URIS"
    "KEYCLOAK_FRONTEND_WEB_ORIGINS"
    "KEYCLOAK_FRONTEND_POST_LOGOUT_URIS"
    "KEYCLOAK_BACKEND_CLIENT_SECRET"
    "KEYCLOAK_ADMIN_USERNAME"
    "KEYCLOAK_ADMIN_EMAIL"
    "KEYCLOAK_ADMIN_FIRST_NAME"
    "KEYCLOAK_ADMIN_LAST_NAME"
    "KEYCLOAK_ADMIN_PASSWORD"
    "KEYCLOAK_FRONTEND_URL"
    "KEYCLOAK_ADMIN_URL"
)

echo "🔍 Checking required environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Check if Keycloak is accessible
echo "📡 Checking Keycloak connectivity..."
if ! curl -s "$KEYCLOAK_URL/realms/master" > /dev/null; then
    echo "❌ Error: Cannot connect to Keycloak at $KEYCLOAK_URL"
    exit 1
fi

echo "✅ Keycloak is accessible"

# Check if jq is available for JSON validation
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required for JSON validation but not installed"
    exit 1
fi

# Generate JSON file from template using envsubst
echo "🔧 Generating realm configuration from template..."
envsubst < keycloak/realm-config-template.json > keycloak/realm-config-generated.json

# Validate JSON syntax
echo "🔍 Validating JSON syntax..."
if ! jq empty keycloak/realm-config-generated.json > /dev/null 2>&1; then
    echo "❌ Invalid JSON generated. Check your environment variables and template."
    echo "Generated file content:"
    cat keycloak/realm-config-generated.json
    exit 1
fi

echo "✅ Realm JSON validated successfully"

# Check if realm already exists
echo "🔍 Checking if realm already exists..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM_NAME" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if [ "$REALM_EXISTS" = "200" ]; then
    echo "⚠️  Realm '$KEYCLOAK_REALM_NAME' already exists. Updating..."
    # Update existing realm
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/keycloak_response.txt \
        -X PUT "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM_NAME" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d @keycloak/realm-config-generated.json)
    
    if [ "$RESPONSE" = "204" ]; then
        echo "✅ Realm updated successfully"
    else
        echo "❌ Failed to update realm. HTTP response code: $RESPONSE"
        echo "Response body:"
        cat /tmp/keycloak_response.txt
        exit 1
    fi
else
    echo "🆕 Creating new realm '$KEYCLOAK_REALM_NAME'..."
    # Create new realm
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/keycloak_response.txt \
        -X POST "$KEYCLOAK_URL/admin/realms" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d @keycloak/realm-config-generated.json)
    
    if [ "$RESPONSE" = "201" ]; then
        echo "✅ Realm created successfully"
    else
        echo "❌ Failed to create realm. HTTP response code: $RESPONSE"
        echo "Response body:"
        cat /tmp/keycloak_response.txt
        exit 1
    fi
fi

# Verify realm setup
echo "🔍 Verifying realm setup..."
REALM_INFO=$(curl -s "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM_NAME" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$REALM_INFO" | jq -e ".realm == \"$KEYCLOAK_REALM_NAME\"" > /dev/null; then
    echo "✅ Realm verification successful"
else
    echo "❌ Realm verification failed"
    exit 1
fi

# Cleanup temporary files
echo "🧹 Cleaning up temporary files..."
rm -f keycloak/realm-config-generated.json
rm -f /tmp/keycloak_response.txt

echo ""
echo "🎉 Keycloak realm deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Realm: $KEYCLOAK_REALM_NAME"
echo "   URL: $KEYCLOAK_URL"
echo "   Admin Console: $KEYCLOAK_URL/admin/"
echo ""
echo "🔑 Default Admin User:"
echo "   Username: $KEYCLOAK_ADMIN_USERNAME"
echo "   Password: [Hidden for security]"
echo ""
echo "📱 Client IDs deployed:"
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
echo "   1. Test authentication with the frontend application"
echo "   2. Verify backend API can authenticate with service account"
echo "   3. Test email functionality with SMTP settings"
echo "   4. Create additional users through the admin console"
