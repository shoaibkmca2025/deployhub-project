#!/bin/bash

# DeployHub Frontend Build Script for Render - Fixed Version
echo "🚀 Starting DeployHub Frontend Build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set permissions for vite
echo "🔧 Setting permissions..."
chmod +x node_modules/.bin/vite 2>/dev/null || true
chmod +x node_modules/.bin/vite.cmd 2>/dev/null || true

# Try different build approaches
echo "🔨 Building application..."

# Method 1: Try npm run build
if npm run build; then
    echo "✅ Build completed successfully with npm run build!"
elif npx vite build; then
    echo "✅ Build completed successfully with npx vite build!"
elif ./node_modules/.bin/vite build; then
    echo "✅ Build completed successfully with direct vite!"
else
    echo "❌ All build methods failed!"
    echo "📋 Debugging information:"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Vite location: $(which vite || echo 'vite not found')"
    echo "Vite in node_modules: $(ls -la node_modules/.bin/vite* || echo 'no vite found')"
    exit 1
fi

# Check if dist folder was created
if [ -d "dist" ]; then
    echo "📁 Build output in: dist/"
    ls -la dist/
    echo "✅ Build verification successful!"
else
    echo "❌ Dist folder not found after build!"
    exit 1
fi
