@echo off
echo 🚀 DeployHub - Final Permission Fix Deployment
echo =============================================

echo.
echo 📦 Committing the vite permission fix...
git add .
git commit -m "Fix vite permission denied - use direct node execution"
git push origin main

echo.
echo ✅ Code pushed to GitHub successfully!
echo.
echo 🎯 Render Configuration:
echo ========================
echo Frontend Service:
echo - Build Command: cd frontend/web && npm install && node node_modules/vite/bin/vite.js build
echo - Publish Directory: frontend/web/dist
echo - Environment Variables: VITE_SERVER_ORIGIN = https://deployhub-backend.onrender.com
echo.
echo Backend Service:
echo - Build Command: cd backend && npm install
echo - Start Command: cd backend && npm start
echo - Health Check: /health
echo.
echo 🎨 Your fancy landing page is ready to deploy!
echo.
echo 📋 Next Steps:
echo 1. Go to https://render.com
echo 2. Create Web Service for backend
echo 3. Create Static Site for frontend
echo 4. Use the configuration above
echo.
pause
