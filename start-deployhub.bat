@echo off
REM DeployHub Quick Start Script
echo 🚀 Starting DeployHub Services...

echo.
echo Stopping any existing Node processes...
taskkill /f /im node.exe 2>nul

echo.
echo Starting Backend Server...
start "DeployHub Backend" cmd /k "cd backend && npm run server:dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "DeployHub Frontend" cmd /k "cd frontend && npm run web:dev"

echo.
echo ✅ Services starting...
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:4000
echo 📊 API Status: http://localhost:4000/api/status
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:5173

