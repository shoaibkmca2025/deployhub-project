#!/bin/bash
# Build script for Render deployment

echo "🚀 Starting DeployHub frontend build..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set permissions for node_modules/.bin
echo "🔧 Setting permissions..."
chmod +x node_modules/.bin/* 2>/dev/null || true

# Build the application
echo "🏗️ Building application..."
npx vite build

echo "✅ Build completed successfully!"
