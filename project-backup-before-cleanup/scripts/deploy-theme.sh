#!/bin/bash

# Keycloak Theme Deployment Script with Cache Management
# This script deploys the My School Buddies theme to Keycloak with proper cache clearing

set -e

# Configuration
KEYCLOAK_DIR="${KEYCLOAK_DIR:-/opt/keycloak}"
THEME_NAME="myschoolbuddies"
KEYCLOAK_URL="${KEYCLOAK_URL:-https://login.hostingmanager.in}"
REALM_NAME="${REALM_NAME:-myschoolbuddies-realm}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with proper permissions
check_permissions() {
    print_status "Checking permissions..."
    
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is not recommended for production."
    fi
    
    if [[ ! -w "$KEYCLOAK_DIR" ]]; then
        print_error "No write permission to Keycloak directory: $KEYCLOAK_DIR"
        exit 1
    fi
}

# Backup existing theme
backup_theme() {
    print_status "Creating backup of existing theme..."
    
    local backup_dir="${KEYCLOAK_DIR}/themes/${THEME_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    
    if [[ -d "${KEYCLOAK_DIR}/themes/${THEME_NAME}" ]]; then
        cp -r "${KEYCLOAK_DIR}/themes/${THEME_NAME}" "$backup_dir"
        print_success "Backup created: $backup_dir"
    else
        print_warning "No existing theme found to backup"
    fi
}

# Deploy theme files
deploy_theme() {
    print_status "Deploying theme files..."
    
    local theme_source="./themes/${THEME_NAME}"
    local theme_dest="${KEYCLOAK_DIR}/themes/${THEME_NAME}"
    
    if [[ ! -d "$theme_source" ]]; then
        print_error "Theme source directory not found: $theme_source"
        exit 1
    fi
    
    # Create destination directory
    mkdir -p "$theme_dest"
    
    # Copy theme files
    cp -r "$theme_source"/* "$theme_dest/"
    
    # Set proper permissions
    chmod -R 644 "$theme_dest"
    find "$theme_dest" -type d -exec chmod 755 {} \;
    
    print_success "Theme files deployed successfully"
}

# Clear Keycloak caches
clear_caches() {
    print_status "Clearing Keycloak caches..."
    
    local cache_dirs=(
        "${KEYCLOAK_DIR}/standalone/tmp"
        "${KEYCLOAK_DIR}/standalone/data/cache"
        "${KEYCLOAK_DIR}/cache"
    )
    
    for cache_dir in "${cache_dirs[@]}"; do
        if [[ -d "$cache_dir" ]]; then
            print_status "Clearing cache directory: $cache_dir"
            rm -rf "$cache_dir"/*
            print_success "Cache cleared: $cache_dir"
        fi
    done
    
    # Clear browser cache instructions
    print_warning "Remember to clear browser cache and hard refresh (Ctrl+Shift+R)"
}

# Restart Keycloak service
restart_keycloak() {
    print_status "Restarting Keycloak service..."
    
    # Try different service management systems
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet keycloak; then
            systemctl restart keycloak
            sleep 10
            if systemctl is-active --quiet keycloak; then
                print_success "Keycloak service restarted successfully"
            else
                print_error "Failed to restart Keycloak service"
                exit 1
            fi
        else
            print_warning "Keycloak service not running or not managed by systemctl"
        fi
    elif command -v docker &> /dev/null; then
        # Check if running in Docker
        if docker ps | grep -q keycloak; then
            print_status "Restarting Keycloak Docker container..."
            docker restart $(docker ps | grep keycloak | awk '{print $1}')
            sleep 15
            print_success "Keycloak Docker container restarted"
        fi
    else
        print_warning "Could not determine how to restart Keycloak. Please restart manually."
    fi
}

# Verify theme deployment
verify_deployment() {
    print_status "Verifying theme deployment..."
    
    # Wait for Keycloak to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        print_status "Checking Keycloak availability (attempt $attempt/$max_attempts)..."
        
        if curl -s -f "${KEYCLOAK_URL}/realms/${REALM_NAME}" > /dev/null; then
            print_success "Keycloak is accessible"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Keycloak is not accessible after $max_attempts attempts"
            exit 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    # Check if theme is available
    local theme_url="${KEYCLOAK_URL}/auth/realms/${REALM_NAME}/login-actions/themes/${THEME_NAME}/login/resources/css/login.css"
    
    if curl -s -f "$theme_url" > /dev/null; then
        print_success "Theme CSS is accessible"
    else
        print_warning "Theme CSS may not be accessible. Check theme configuration."
    fi
}

# Update realm configuration to use new theme
update_realm_config() {
    print_status "Updating realm configuration to use theme..."
    
    # This would typically be done via Keycloak Admin API
    # For now, provide manual instructions
    print_warning "Manual step required:"
    print_warning "1. Log into Keycloak Admin Console: ${KEYCLOAK_URL}/auth/admin"
    print_warning "2. Select realm: ${REALM_NAME}"
    print_warning "3. Go to Realm Settings > Themes"
    print_warning "4. Set Login Theme to: ${THEME_NAME}"
    print_warning "5. Click Save"
}

# Main deployment process
main() {
    print_status "Starting Keycloak theme deployment..."
    print_status "Theme: $THEME_NAME"
    print_status "Keycloak URL: $KEYCLOAK_URL"
    print_status "Realm: $REALM_NAME"
    
    check_permissions
    backup_theme
    deploy_theme
    clear_caches
    restart_keycloak
    verify_deployment
    update_realm_config
    
    print_success "Theme deployment completed successfully!"
    print_status "Theme version: $THEME_NAME-$(date +%Y%m%d)"
    
    # Final instructions
    echo
    print_status "Next steps:"
    echo "1. Clear your browser cache and hard refresh"
    echo "2. Test login page: ${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/auth"
    echo "3. Verify theme changes are visible"
    echo "4. Test complete login flow"
}

# Run main function
main "$@"