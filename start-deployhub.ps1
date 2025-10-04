# DeployHub PowerShell Startup Script
Write-Host "🚀 Starting DeployHub Services..." -ForegroundColor Green

Write-Host ""
Write-Host "Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
cd backend
npm install
cd ..\frontend
npm install
cd ..

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run server:dev"

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run web:dev"

Write-Host ""
Write-Host "✅ Services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "🔧 Backend: http://localhost:4000" -ForegroundColor Blue
Write-Host "📊 API Status: http://localhost:4000/api/status" -ForegroundColor Blue
Write-Host ""
Write-Host "Press any key to open the application..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5173"
