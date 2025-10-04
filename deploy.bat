@echo off
REM DeployHub Deployment Script for Windows

echo 🚀 DeployHub Deployment Script
echo ================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

if "%1"=="dev" goto start_dev
if "%1"=="prod" goto start_prod
if "%1"=="stop" goto stop_services
if "%1"=="restart" goto restart_services
if "%1"=="logs" goto show_logs
if "%1"=="clean" goto clean_up
if "%1"=="build" goto build_images
if "%1"=="status" goto show_status
goto show_usage

:start_dev
echo 🔧 Starting development environment...
docker-compose -f docker-compose.dev.yml up --build -d
echo ✅ Development environment started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000
goto end

:start_prod
echo 🏭 Starting production environment...
docker-compose up --build -d
echo ✅ Production environment started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000
goto end

:stop_services
echo 🛑 Stopping all services...
docker-compose down
docker-compose -f docker-compose.dev.yml down
echo ✅ All services stopped!
goto end

:restart_services
call :stop_services
call :start_prod
goto end

:show_logs
echo 📋 Showing logs...
docker-compose logs -f
goto end

:clean_up
echo 🧹 Cleaning up containers and volumes...
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
echo ✅ Cleanup completed!
goto end

:build_images
echo 🔨 Building all images...
docker-compose build
echo ✅ All images built!
goto end

:show_status
echo 📊 Service Status:
echo ==================
docker-compose ps
goto end

:show_usage
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   dev         Start development environment
echo   prod        Start production environment
echo   stop        Stop all services
echo   restart     Restart all services
echo   logs        Show logs
echo   clean       Clean up containers and volumes
echo   build       Build all images
echo   status      Show service status
echo.
goto end

:end
