@echo off
REM Comprehensive cleanup script for DeployHub project
REM This script removes unwanted files and old directories

echo 🧹 DeployHub Cleanup Script
echo ===========================

echo.
echo Removing unwanted files...

REM Remove unwanted files
if exist "clear-auth.js" del "clear-auth.js"
if exist "test-deployment-links.js" del "test-deployment-links.js"
if exist "test-deployment.js" del "test-deployment.js"
if exist "design.md" del "design.md"
if exist "interaction.md" del "interaction.md"
if exist "outline.md" del "outline.md"

echo ✅ Removed unwanted files

echo.
echo Attempting to remove old directories...

REM Try to remove old directories
if exist "agent" (
    echo Removing agent directory...
    rmdir /s /q "agent" 2>nul
    if exist "agent" (
        echo ⚠️  Could not remove agent directory - it may be in use
    ) else (
        echo ✅ Removed agent directory
    )
)

if exist "server" (
    echo Removing server directory...
    rmdir /s /q "server" 2>nul
    if exist "server" (
        echo ⚠️  Could not remove server directory - it may be in use
    ) else (
        echo ✅ Removed server directory
    )
)

if exist "web" (
    echo Removing web directory...
    rmdir /s /q "web" 2>nul
    if exist "web" (
        echo ⚠️  Could not remove web directory - it may be in use
    ) else (
        echo ✅ Removed web directory
    )
)

REM Remove root node_modules and package-lock.json
if exist "node_modules" (
    echo Removing root node_modules...
    rmdir /s /q "node_modules" 2>nul
    echo ✅ Removed root node_modules
)

if exist "package-lock.json" (
    echo Removing root package-lock.json...
    del "package-lock.json" 2>nul
    echo ✅ Removed root package-lock.json
)

echo.
echo 🎯 Cleanup Summary:
echo ===================
echo ✅ New structure is ready:
echo    - frontend/ (contains web/ and static files)
echo    - backend/ (contains server/ and agent/)
echo    - docker-compose.yml (production)
echo    - docker-compose.dev.yml (development)
echo.

if exist "agent" (
    echo ⚠️  Old directories still exist (locked by processes):
    if exist "agent" echo    - agent/
    if exist "server" echo    - server/
    if exist "web" echo    - web/
    echo.
    echo To remove locked directories:
    echo 1. Close all applications (VS Code, terminals, etc.)
    echo 2. Restart your computer
    echo 3. Run this script again
) else (
    echo ✅ All old directories removed successfully!
)

echo.
echo 🚀 Ready to deploy:
echo    npm run dev     - Start development
echo    npm run deploy  - Deploy to production
echo.

pause

