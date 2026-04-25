#!/bin/bash

# Clean build cache and rebuild
echo "🧹 Cleaning build cache..."

# Clean frontend
echo "Cleaning frontend cache..."
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite

# Clean backend
echo "Cleaning backend cache..."
cd backend
rm -rf node_modules/.cache
rm -rf dist
rm -rf .tsc-cache

echo "✅ Cache cleaned. Rebuilding..."

# Rebuild backend
npm run build

cd ..
echo "✅ Clean build completed!"