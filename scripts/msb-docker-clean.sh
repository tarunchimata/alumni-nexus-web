#!/bin/bash

# Safe My School Buddies Docker Cleanup Script
# Includes confirmations and only affects MSB resources
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

print_warning "🧹 My School Buddies Docker Cleanup"
print_warning "This will remove MSB containers, images, networks, and volumes"

# Show what will be affected
print_info "Checking MSB Docker resources..."
echo ""
echo "Containers to remove:"
docker ps -a --filter name=msb --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "None found"
docker ps -a --filter name=docker_ --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "None found"
echo ""
echo "Networks to remove:"
docker network ls --filter name=myschoolbuddies --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null || echo "None found"
echo ""
echo "Volumes to remove:"
docker volume ls --filter name=docker_ --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null || echo "None found"
echo ""

# Confirmation prompt
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Cleanup cancelled"
    exit 0
fi

print_info "Starting MSB cleanup..."

# Check if we're in the right directory
if [ ! -f "docker/docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd docker

# Stop MSB services
print_info "Stopping MSB services..."
docker compose down --remove-orphans 2>/dev/null || true

# Remove MSB containers
print_info "Removing MSB containers..."
docker rm $(docker ps -aq -f name=msb) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_backend) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_frontend) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_nginx) 2>/dev/null || true

# Remove MSB images (with confirmation)
print_info "Found MSB images:"
docker images --filter reference="docker_*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null || echo "None found"
echo ""
read -p "Remove MSB images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Removing MSB images..."
    docker rmi $(docker images -q --filter reference="docker_*") 2>/dev/null || true
fi

# Remove MSB networks
print_info "Removing MSB networks..."
docker network rm myschoolbuddies-network 2>/dev/null || true

# Remove MSB volumes (with confirmation)
print_info "Found MSB volumes:"
docker volume ls --filter name=docker_ --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null || echo "None found"
echo ""
read -p "Remove MSB volumes? This will delete logs and uploads! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Removing MSB volumes..."
    docker volume rm docker_backend_logs docker_backend_uploads 2>/dev/null || true
fi

print_status "MSB cleanup completed!"
print_info "Run ./scripts/msb-docker-restart.sh to rebuild and start services"

cd ..