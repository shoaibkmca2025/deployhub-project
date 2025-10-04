@echo off
REM DeployHub Render Deployment Script for Windows

echo 🚀 DeployHub Render Deployment Script
echo =====================================

REM Check if git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first.
    echo Download from: https://git-scm.com/downloads
    pause
    exit /b 1
)

REM Check if we're in a git repository
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit - DeployHub project"
)

REM Check git status
echo 📋 Current Git status:
git status

echo.
echo 🔧 Preparing for Render deployment...

REM Create production environment file for frontend
echo 📝 Creating production environment file...
echo VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com > frontend\web\.env.production

REM Add all files to git
echo 📦 Adding files to Git...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Prepare for Render deployment - %date% %time%"

echo.
echo ✅ Ready for deployment!
echo.
echo 📋 Next steps:
echo 1. Push to GitHub:
echo    git remote add origin https://github.com/yourusername/deployhub.git
echo    git push -u origin main
echo.
echo 2. Deploy on Render:
echo    - Go to https://render.com
echo    - Create new Web Service for backend:
echo      * Root Directory: . (project root)
echo      * Build Command: cd backend ^&^& npm install
echo      * Start Command: cd backend ^&^& npm start
echo    - Create new Static Site for frontend:
echo      * Root Directory: . (project root)
echo      * Build Command: cd frontend ^&^& npm install ^&^& npx vite build
echo      * Publish Directory: frontend/dist
echo    - See RENDER_DEPLOYMENT_FIXED.md for complete details
echo.
echo 3. Update environment variables with your actual Render URLs
echo.
echo 🎯 Your services will be available at:
echo    Backend: https://deployhub-backend.onrender.com
echo    Frontend: https://deployhub-frontend.onrender.com
echo.
echo 📚 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions
echo.
pause
