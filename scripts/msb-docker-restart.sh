#!/bin/bash

# Safe My School Buddies Docker Restart Script
# Only affects MSB containers and networks
set -e

# Make script executable
chmod +x "$0"

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

print_info "🔄 Safely restarting My School Buddies Docker services..."

# Check if we're in the right directory
if [ ! -f "docker/docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd docker

# Stop only MSB containers (safe approach)
print_info "Stopping MSB containers only..."
docker compose down --remove-orphans 2>/dev/null || true

# Remove only MSB-specific containers
print_info "Removing MSB containers..."
docker rm $(docker ps -aq -f name=msb) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_backend) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_frontend) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_nginx) 2>/dev/null || true

# Remove only MSB networks and volumes (safe)
print_info "Cleaning MSB-specific networks and volumes..."
docker network rm myschoolbuddies-network 2>/dev/null || true
docker volume rm docker_backend_logs docker_backend_uploads 2>/dev/null || true

# Set project name for consistency
export COMPOSE_PROJECT_NAME=msb

# Build and start
print_info "Building and starting MSB services..."
docker compose -f docker-compose.yml build --no-cache
docker compose -f docker-compose.yml up -d

# Wait for services to start
print_info "Waiting for services to initialize..."
sleep 15

# Health check
print_info "Checking service health..."
docker compose ps

# Verify backend health
if curl -s http://localhost:3033/health >/dev/null 2>&1; then
    print_status "Backend is healthy!"
else
    print_warning "Backend health check failed - may still be starting"
fi

# Verify frontend
if curl -s http://localhost:8080 >/dev/null 2>&1; then
    print_status "Frontend is accessible!"
else
    print_warning "Frontend not yet accessible - may still be starting"
fi

print_status "MSB Docker services restarted safely!"
print_info "Backend: http://localhost:3033"
print_info "Frontend: http://localhost:8080"

cd ..