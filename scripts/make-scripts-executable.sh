#!/bin/bash

# Make all scripts executable
echo "Making scripts executable..."

chmod +x scripts/*.sh
chmod +x scripts/*.js
chmod +x scripts/*.cjs

# Backend scripts
if [ -d "backend/src/scripts" ]; then
    chmod +x backend/src/scripts/*.ts
    chmod +x backend/src/scripts/*.js
fi

echo "✅ All scripts are now executable"