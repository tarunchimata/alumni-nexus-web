#!/bin/bash

# Version tagging script for My School Buddies
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Ask for new version
echo -n "Enter new version (current: $CURRENT_VERSION): "
read NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    print_error "No version provided"
    exit 1
fi

# Validate version format (basic semver check)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use semantic versioning (e.g., 1.0.0)"
    exit 1
fi

# Check if tag already exists
if git rev-parse "v$NEW_VERSION" >/dev/null 2>&1; then
    print_error "Tag v$NEW_VERSION already exists"
    exit 1
fi

# Update backend package.json version
print_status "Updating backend version to $NEW_VERSION"
cd backend
npm version $NEW_VERSION --no-git-tag-version
cd ..

# Stage changes
git add backend/package.json

# Create commit
COMMIT_MESSAGE="chore: bump version to $NEW_VERSION"
git commit -m "$COMMIT_MESSAGE"

# Create and push tag
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
git push origin "v$NEW_VERSION"
git push origin main

print_success "Version $NEW_VERSION tagged and pushed successfully!"
print_status "Tag: v$NEW_VERSION"
print_status "Commit: $COMMIT_MESSAGE"