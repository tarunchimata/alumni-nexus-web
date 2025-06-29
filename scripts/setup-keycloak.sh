
#!/bin/bash

# Keycloak Setup Script for My School Buddies
# This script sets up the Keycloak realm and clients

set -e

# Configuration
KEYCLOAK_URL="https://login.hostingmanager.in"
KEYCLOAK_REALM="myschoolbuddies-realm"
ADMIN_USER="admin"
ADMIN_PASSWORD="S@feAdminKeycloak!2025"

echo "🚀 Setting up Keycloak for My School Buddies..."

# Check if Keycloak is accessible
echo "📡 Checking Keycloak connectivity..."
if ! curl -s "$KEYCLOAK_URL/auth/realms/master" > /dev/null; then
    echo "❌ Error: Cannot connect to Keycloak at $KEYCLOAK_URL"
    exit 1
fi

echo "✅ Keycloak is accessible"

# Get admin access token
echo "🔐 Obtaining admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/auth/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASSWORD" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | \
    python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Error: Failed to obtain admin token"
    exit 1
fi

echo "✅ Admin token obtained"

# Check if realm already exists
echo "🔍 Checking if realm exists..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$KEYCLOAK_URL/auth/admin/realms/$KEYCLOAK_REALM" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if [ "$REALM_EXISTS" = "200" ]; then
    echo "⚠️  Realm '$KEYCLOAK_REALM' already exists. Updating..."
    # Update existing realm
    curl -s -X PUT "$KEYCLOAK_URL/auth/admin/realms/$KEYCLOAK_REALM" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d @keycloak/realm-config.json
else
    echo "🆕 Creating new realm '$KEYCLOAK_REALM'..."
    # Create new realm
    curl -s -X POST "$KEYCLOAK_URL/auth/admin/realms" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d @keycloak/realm-config.json
fi

echo "✅ Realm setup completed"

# Create roles if they don't exist
echo "👥 Setting up realm roles..."
ROLES=("platform_admin" "school_admin" "teacher" "student" "alumni")

for role in "${ROLES[@]}"; do
    echo "📝 Creating role: $role"
    curl -s -X POST "$KEYCLOAK_URL/auth/admin/realms/$KEYCLOAK_REALM/roles" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$role\",\"description\":\"$role role for My School Buddies\"}" || true
done

echo "✅ Roles setup completed"

# Verify setup
echo "🔍 Verifying setup..."
REALM_INFO=$(curl -s "$KEYCLOAK_URL/auth/admin/realms/$KEYCLOAK_REALM" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$REALM_INFO" | grep -q "myschoolbuddies-realm"; then
    echo "✅ Realm verification successful"
else
    echo "❌ Realm verification failed"
    exit 1
fi

echo ""
echo "🎉 Keycloak setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "   Realm: $KEYCLOAK_REALM"
echo "   URL: $KEYCLOAK_URL"
echo "   Admin Console: $KEYCLOAK_URL/auth/admin/"
echo ""
echo "🔑 Default Admin User:"
echo "   Username: admin@myschoolbuddies.com"
echo "   Password: Admin@123"
echo ""
echo "📱 Client IDs created:"
echo "   Frontend: frontend-client"
echo "   Backend: backend-client"
echo ""
echo "👥 Roles created:"
echo "   - platform_admin"
echo "   - school_admin" 
echo "   - teacher"
echo "   - student"
echo "   - alumni"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Run the database setup: psql -h pg.hostingmanager.in -U msbfinalroot -d myschoolbuddies_budibase_db -f database/schema.sql"
echo "   2. Seed initial data: psql -h pg.hostingmanager.in -U msbfinalroot -d myschoolbuddies_budibase_db -f database/seed-data.sql"
echo "   3. Configure your backend application with the client secrets"
echo "   4. Update frontend configuration with Keycloak settings"
