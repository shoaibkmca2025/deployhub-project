@echo off
REM DeployHub Final Deployment Script

echo 🚀 DeployHub Final Deployment
echo =============================

echo.
echo 📦 Preparing code for deployment...

REM Add all changes to git
echo Adding files to git...
git add .

REM Commit changes
echo Committing changes...
git commit -m "Deploy DeployHub - Production ready with fixed index.html"

REM Push to GitHub
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ Code pushed to GitHub successfully!
echo.
echo 🎯 Next steps:
echo 1. Go to https://render.com
echo 2. Create Web Service for backend:
echo    - Name: deployhub-backend
echo    - Root Directory: . (project root)
echo    - Build Command: cd backend ^&^& npm install
echo    - Start Command: cd backend ^&^& npm start
echo    - Health Check: /health
echo.
echo 3. Create Static Site for frontend:
echo    - Name: deployhub-frontend
echo    - Root Directory: . (project root)
echo    - Build Command: cd frontend ^&^& npm install ^&^& npx vite build
echo    - Publish Directory: frontend/dist
echo.
echo 4. Set environment variables:
echo    Backend: NODE_ENV=production, PORT=4000, FRONTEND_URL=https://deployhub-frontend.onrender.com
echo    Frontend: VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com
echo.
echo 5. Update URLs with actual Render URLs after deployment
echo.
echo 📚 See FINAL_DEPLOYMENT_GUIDE.md for complete instructions
echo.
echo 🎉 Your DeployHub application is ready to deploy!
echo.

pause
