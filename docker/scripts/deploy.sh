#!/bin/bash

# ==================================================
# My School Buddies - Professional Deployment Script
# ==================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="My School Buddies"
DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
LOG_DIR="$DOCKER_DIR/logs"
BACKUP_DIR="$DOCKER_DIR/../project-backup-before-final-sanitization"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Health check function
health_check() {
    log "Performing health checks..."
    
    # Check backend health
    if curl -s http://localhost:3033/health > /dev/null 2>&1; then
        log "✅ Backend health check passed"
    else
        error "❌ Backend health check failed"
        return 1
    fi
    
    # Check frontend availability
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        log "✅ Frontend health check passed"
    else
        warning "⚠️ Frontend health check failed (may be starting)"
    fi
}

# Backup function
backup_before_deploy() {
    log "Creating backup before deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/../$BACKUP_NAME"
    mkdir -p "$BACKUP_PATH"
    
    # Backup current Docker state
    docker compose ps > "$BACKUP_PATH/docker-state.txt" 2>/dev/null || true
    docker compose config > "$BACKUP_PATH/docker-config.yml" 2>/dev/null || true
    
    # Backup environment
    cp "$DOCKER_DIR/.env" "$BACKUP_PATH/" 2>/dev/null || true
    
    log "✅ Backup created: $BACKUP_PATH"
}

# Cleanup old containers
cleanup_containers() {
    log "Cleaning up old containers..."
    docker compose down --remove-orphans 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    log "✅ Container cleanup completed"
}

# Build functions
build_frontend() {
    log "Building frontend container..."
    docker compose build frontend
    log "✅ Frontend build completed"
}

build_backend() {
    log "Building backend container..."
    docker compose build backend
    log "✅ Backend build completed"
}

build_full() {
    log "Building full application..."
    docker compose build
    log "✅ Full application build completed"
}

# Start functions
start_frontend() {
    log "Starting frontend service..."
    docker compose up -d frontend
    log "✅ Frontend started"
}

start_backend() {
    log "Starting backend service..."
    docker compose up -d backend
    log "✅ Backend started"
}

start_full() {
    log "Starting full application..."
    docker compose up -d
    log "✅ Full application started"
    sleep 5
    health_check
}

# Management functions
restart_services() {
    log "Restarting all services..."
    docker compose restart
    sleep 5
    health_check
}

stop_services() {
    log "Stopping all services..."
    docker compose down
    log "✅ Services stopped"
}

view_logs() {
    log "Displaying logs (Ctrl+C to exit)..."
    docker compose logs -f --tail=100
}

# Main menu
show_menu() {
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}   $PROJECT_NAME - Deployment Menu${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo
    echo "1. Build Frontend Only"
    echo "2. Build Backend Only"
    echo "3. Build Full Application"
    echo "4. Start Frontend Only"
    echo "5. Start Backend Only"
    echo "6. Start Full Application"
    echo "7. Restart Services"
    echo "8. Stop Services"
    echo "9. View Logs"
    echo "10. Backup Before Deploy"
    echo "11. Health Check"
    echo "12. Cleanup Old Containers"
    echo "13. Exit"
    echo
    echo -e "${BLUE}Current Directory: $DOCKER_DIR${NC}"
    echo -e "${BLUE}Log Directory: $LOG_DIR${NC}"
    echo
}

# Main execution
main() {
    cd "$DOCKER_DIR"
    
    while true; do
        show_menu
        read -p "Please select an option (1-13): " choice
        
        case $choice in
            1)
                build_frontend
                ;;
            2)
                build_backend
                ;;
            3)
                build_full
                ;;
            4)
                start_frontend
                ;;
            5)
                start_backend
                ;;
            6)
                start_full
                ;;
            7)
                restart_services
                ;;
            8)
                stop_services
                ;;
            9)
                view_logs
                ;;
            10)
                backup_before_deploy
                ;;
            11)
                health_check
                ;;
            12)
                cleanup_containers
                ;;
            13)
                log "Exiting deployment script..."
                exit 0
                ;;
            *)
                error "Invalid option. Please select 1-13."
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker first."
    exit 1
fi

# Run main function
main "$@"
