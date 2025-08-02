
#!/bin/bash

# Database Setup Script for My School Buddies
# This script sets up the PostgreSQL database schema

set -e

# Configuration from your provided credentials
DB_HOST="pg.hostingmanager.in"
DB_PORT="5432"
DB_NAME="myschoolbuddies_budibase_db"
DB_USER="msbfinalroot"
DB_PASSWORD="vA5ZXB2Nb6M3P22GWZRch999"

echo "🚀 Setting up PostgreSQL database for My School Buddies..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL client."
    exit 1
fi

# Test database connection
echo "📡 Testing database connection..."
export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "   Host: $DB_HOST:$DB_PORT"
    echo "   Database: $DB_NAME" 
    echo "   User: $DB_USER"
    exit 1
fi

echo "✅ Database connection successful"

# Run schema creation
echo "🏗️  Creating database schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Error: Failed to create database schema"
    exit 1
fi

# Run seed data
echo "🌱 Inserting seed data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/seed-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Seed data inserted successfully"
else
    echo "❌ Error: Failed to insert seed data"
    exit 1
fi

# Verify setup
echo "🔍 Verifying database setup..."
TABLES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')

if [ "$TABLES_COUNT" -ge 5 ]; then
    echo "✅ Database verification successful ($TABLES_COUNT tables created)"
else
    echo "❌ Database verification failed (expected at least 5 tables, found $TABLES_COUNT)"
    exit 1
fi

# Show table information
echo ""
echo "📊 Database Tables Created:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Database Summary:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Tables: schools, users, classes, user_class_groups, messages"
echo ""
echo "📱 Sample Schools Created:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, name, udise_code, school_type FROM schools;"

echo ""
echo "⚠️  Next Steps:"
echo "   1. Run Keycloak setup: ./scripts/setup-keycloak.sh"
echo "   2. Configure your backend API to connect to this database"
echo "   3. Update your frontend to connect to Keycloak and backend API"

# Unset password
unset PGPASSWORD
