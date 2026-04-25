#!/bin/bash

# DEPRECATED: This script was too aggressive and dangerous
# Use the safer alternatives instead:
# - ./scripts/msb-docker-restart.sh (safe restart)
# - ./scripts/msb-docker-clean.sh (cleanup with confirmations)

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_error "DEPRECATED: This script has been replaced with safer alternatives"
print_warning "This script was too aggressive and could affect other Docker projects"
echo ""
print_info "Use these safer alternatives instead:"
print_info "  ./scripts/msb-docker-restart.sh  - Safe restart of MSB services"
print_info "  ./scripts/msb-docker-clean.sh    - Cleanup with confirmations"
echo ""
print_info "These scripts only affect My School Buddies containers and resources"
exit 1