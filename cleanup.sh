#!/bin/bash
# Cleanup script for old directories
# Run this script after stopping all running processes

echo "🧹 Cleaning up old directories..."

# Remove old directories if they exist
if [ -d "agent" ]; then
    echo "Removing old agent directory..."
    rm -rf agent
fi

if [ -d "server" ]; then
    echo "Removing old server directory..."
    rm -rf server
fi

if [ -d "web" ]; then
    echo "Removing old web directory..."
    rm -rf web
fi

# Remove old node_modules if they exist
if [ -d "node_modules" ]; then
    echo "Removing root node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "Removing root package-lock.json..."
    rm package-lock.json
fi

echo "✅ Cleanup completed!"
echo ""
echo "New structure:"
echo "- frontend/ (contains web/ and static files)"
echo "- backend/ (contains server/ and agent/)"
echo "- docker-compose.yml (production)"
echo "- docker-compose.dev.yml (development)"

