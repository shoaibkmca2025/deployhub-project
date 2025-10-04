#!/bin/bash
# Test script to verify frontend React app is working

echo "🧪 Testing Frontend React App..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🏗️ Building React application..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful! dist folder created."
    
    # Check for key files
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html found in dist folder"
    else
        echo "❌ index.html not found in dist folder"
    fi
    
    if [ -d "dist/assets" ]; then
        echo "✅ assets folder found in dist folder"
    else
        echo "❌ assets folder not found in dist folder"
    fi
    
    # List contents of dist folder
    echo "📁 Contents of dist folder:"
    ls -la dist/
    
else
    echo "❌ Build failed! dist folder not created."
    echo "📋 Build logs:"
    npm run build
fi

echo "🎯 Test completed!"
