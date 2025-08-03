#!/bin/bash

# Fix Docker Port Conflicts Script
# This script cleans up Docker resources and fixes port binding issues

set -e

echo "🔧 Fixing Docker Port Conflicts..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is in use"
        lsof -Pi :$port -sTCP:LISTEN
        return 0
    else
        echo "✅ Port $port is available"
        return 1
    fi
}

# Function to force kill processes on port
kill_port_processes() {
    local port=$1
    echo "🔪 Killing processes on port $port..."
    
    # Kill processes using the port
    lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
    
    # Kill any node processes that might be hanging
    pkill -f "node.*$port" 2>/dev/null || true
    pkill -f "ts-node.*$port" 2>/dev/null || true
    
    # Wait a moment
    sleep 2
}

# Function to clean Docker resources
clean_docker() {
    echo "🧹 Cleaning Docker resources..."
    
    # Stop and remove all containers with our project name
    docker ps -a --filter "name=docker_" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    docker ps -a --filter "name=myschoolbuddies" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    
    # Remove network if it exists
    docker network rm myschoolbuddies-network 2>/dev/null || true
    
    # Remove volumes if they exist
    docker volume rm docker_backend_logs docker_backend_uploads 2>/dev/null || true
    
    # Prune unused Docker resources
    docker system prune -f 2>/dev/null || true
    
    echo "✅ Docker cleanup completed"
}

# Main execution
echo "🔍 Checking ports 3001, 3005, 3006..."

# Check and clean ports
for port in 3001 3033 3005 3006; do
    if check_port $port; then
        kill_port_processes $port
    fi
done

# Clean Docker resources
clean_docker

# Final port check
echo ""
echo "🔍 Final port status:"
for port in 3001 3033 3005 3006; do
    check_port $port || true
done

echo ""
echo "✅ Docker port conflicts fixed!"
echo "You can now run: ./scripts/deploy.sh"