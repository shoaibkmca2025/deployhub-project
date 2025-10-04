#!/bin/bash

# DeployHub Frontend Build Script for Render
echo "🚀 Starting DeployHub Frontend Build..."

# Set proper permissions
chmod +x node_modules/.bin/vite

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Make sure vite is executable
chmod +x node_modules/.bin/vite

# Build the application
echo "🔨 Building application..."
npx vite build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output in: dist/"
    ls -la dist/
else
    echo "❌ Build failed!"
    exit 1
fi
