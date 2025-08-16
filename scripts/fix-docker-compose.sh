#!/bin/bash

# Fix Docker Compose ContainerConfig Error Script
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

print_info "Fixing Docker Compose ContainerConfig error..."

cd docker

# Stop and remove all containers
print_info "Stopping and removing containers..."
docker compose down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq -f name=docker_) 2>/dev/null || true

# Remove Docker networks and volumes
print_info "Cleaning up networks and volumes..."
docker network rm myschoolbuddies-network 2>/dev/null || true
docker volume rm docker_backend_logs docker_backend_uploads 2>/dev/null || true

# Prune Docker system
print_info "Pruning Docker system..."
docker system prune -f

# Set project name and use Docker Compose v2
export COMPOSE_PROJECT_NAME=msb

# Build and start with Docker Compose v2
print_info "Building and starting with Docker Compose v2..."
docker compose -f docker-compose.yml build --no-cache
docker compose -f docker-compose.yml up -d

# Wait for services to start
print_info "Waiting for services to initialize..."
sleep 10

# Check container status
print_info "Checking container status..."
docker compose ps

print_status "Docker Compose fixed and running!"
print_info "Services started successfully"

cd ..