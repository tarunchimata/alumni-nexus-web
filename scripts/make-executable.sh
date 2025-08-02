#!/bin/bash

# Make all scripts executable
chmod +x scripts/*.sh
echo "✅ All scripts are now executable"
echo "Available scripts:"
echo "  - ./scripts/fix-backend-deps.sh   # Fix backend dependencies"
echo "  - ./scripts/start-backend.sh      # Start backend development server"
echo "  - ./scripts/start-dev.sh          # Start both backend and frontend"
echo "  - ./scripts/verify-setup.sh       # Verify complete setup"
echo "  - ./scripts/test-complete-flow.sh # Test complete registration flow"
echo "  - ./scripts/deploy.sh            # Full deployment script"
echo ""
echo "Testing scripts:"
echo "  - node scripts/test-registration.mjs # Test registration flow via API"