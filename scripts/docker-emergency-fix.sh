#!/bin/bash

# Emergency Docker Fix Script
# Fixes the critical backend container restart loop issue

set -e

echo "🚨 EMERGENCY DOCKER FIX - My School Buddies"
echo "=============================================="

# Function to stop and remove all related containers
cleanup_containers() {
    echo "🧹 Cleaning up containers..."
    
    # Stop all containers with our project name
    docker ps -a --filter "name=docker_" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
    docker ps -a --filter "name=docker_" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    
    # Remove myschoolbuddies containers
    docker ps -a --filter "name=myschoolbuddies" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
    docker ps -a --filter "name=myschoolbuddies" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    
    # Remove network
    docker network rm myschoolbuddies-network 2>/dev/null || true
    
    # Remove images to force rebuild
    docker rmi docker_backend docker_frontend 2>/dev/null || true
    
    echo "✅ Cleanup completed"
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    echo "🔪 Killing processes on port $port..."
    
    # Kill processes using the port (more aggressive)
    lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
    fuser -k ${port}/tcp 2>/dev/null || true
    
    # Wait for port to be freed
    sleep 3
}

# Main execution
echo "1. Killing processes on critical ports..."
for port in 3001 3000 80 443; do
    kill_port_processes $port
done

echo ""
echo "2. Cleaning up Docker resources..."
cleanup_containers

echo ""
echo "3. Building and starting services..."

# Navigate to docker directory
cd "$(dirname "$0")/.."

# Build and start services with proper error handling
docker-compose -f docker/docker-compose.yml up --build -d

echo ""
echo "4. Checking service status..."
sleep 10

# Check container status
echo "Container Status:"
docker ps --filter "name=docker_"

echo ""
echo "5. Checking health endpoints..."

# Wait for services to be ready
sleep 30

# Test backend health
echo "Testing backend health..."
if curl -f http://localhost:3001/health 2>/dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "Backend logs:"
    docker logs docker_backend_1 --tail 20
fi

# Test frontend health
echo "Testing frontend..."
if curl -f http://localhost:3000 2>/dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend health check failed"
    echo "Frontend logs:"
    docker logs docker_frontend_1 --tail 20
fi

echo ""
echo "🎉 Emergency fix completed!"
echo ""
echo "Services should now be available at:"
echo "  - Backend API: http://localhost:3001"
echo "  - Frontend:    http://localhost:3000"
echo ""
echo "If issues persist, check logs with:"
echo "  docker logs docker_backend_1"
echo "  docker logs docker_frontend_1"