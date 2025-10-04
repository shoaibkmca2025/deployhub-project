#!/bin/bash
# DeployHub Render Deployment Script

echo "🚀 DeployHub Render Deployment Script"
echo "====================================="

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - DeployHub project"
fi

# Check git status
echo "📋 Current Git status:"
git status

echo ""
echo "🔧 Preparing for Render deployment..."

# Create production environment file for frontend
echo "📝 Creating production environment file..."
echo "VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com" > frontend/web/.env.production

# Add all files to git
echo "📦 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Prepare for Render deployment - $(date)"

echo ""
echo "✅ Ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/deployhub.git"
echo "   git push -u origin main"
echo ""
echo "2. Deploy on Render:"
echo "   - Go to https://render.com"
echo "   - Create new Web Service for backend"
echo "   - Create new Static Site for frontend"
echo "   - Use the configuration from RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "3. Update environment variables with your actual Render URLs"
echo ""
echo "🎯 Your services will be available at:"
echo "   Backend: https://deployhub-backend.onrender.com"
echo "   Frontend: https://deployhub-frontend.onrender.com"
echo ""
echo "📚 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions"
