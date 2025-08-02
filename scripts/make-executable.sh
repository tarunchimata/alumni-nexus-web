#!/bin/bash

# Make all scripts executable
chmod +x scripts/*.sh
echo "✅ All scripts are now executable"
echo "Available scripts:"
echo "  - ./scripts/fix-backend-deps.sh   # Fix backend dependencies"
echo "  - ./scripts/start-backend.sh      # Start backend development server"
echo "  - ./scripts/verify-setup.sh       # Verify complete setup"
echo "  - ./scripts/deploy.sh            # Full deployment script"