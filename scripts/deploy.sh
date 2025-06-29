
#!/bin/bash

# Deployment Script for My School Buddies
# This script handles the complete deployment process

set -e

echo "🚀 Deploying My School Buddies Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    exit 1
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Set up environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing"
    echo "Press Enter when ready..."
    read
fi

# Set up database
echo "🗄️  Setting up database..."
if [ -f "scripts/setup-database.sh" ]; then
    chmod +x scripts/setup-database.sh
    ./scripts/setup-database.sh
else
    echo "⚠️  Database setup script not found. Please run manually:"
    echo "   psql -h pg.hostingmanager.in -U msbfinalroot -d myschoolbuddies_budibase_db -f database/schema.sql"
fi

# Set up Keycloak
echo "🔐 Setting up Keycloak..."
if [ -f "scripts/setup-keycloak.sh" ]; then
    chmod +x scripts/setup-keycloak.sh
    ./scripts/setup-keycloak.sh
else
    echo "⚠️  Keycloak setup script not found. Please configure manually."
fi

# Build and start services
echo "🐳 Building and starting Docker containers..."
cd docker
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Running health checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service is not responding"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend service is healthy"
else
    echo "❌ Frontend service is not responding"
fi

# Show running containers
echo ""
echo "📊 Running containers:"
docker-compose ps

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Access Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   API Documentation: http://localhost:3001/api-docs" 
echo "   Keycloak Admin: https://login.hostingmanager.in/auth/admin/"
echo ""
echo "🔑 Default Login:"
echo "   Username: admin@myschoolbuddies.com"
echo "   Password: Admin@123"
echo ""
echo "📊 Container Logs:"
echo "   All services: docker-compose logs -f"
echo "   Frontend only: docker-compose logs -f frontend"
echo "   Backend only: docker-compose logs -f backend"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Access the application at http://localhost:3000"
echo "   2. Login with the default admin credentials"
echo "   3. Create schools and users through the admin dashboard"
echo "   4. Configure DNS and SSL for production deployment"
