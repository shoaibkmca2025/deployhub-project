# PowerShell script to remove locked directories
# Run this script as Administrator if needed

Write-Host "🧹 Removing locked directories..." -ForegroundColor Yellow

# Function to force remove directory
function Remove-LockedDirectory {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Write-Host "Attempting to remove: $Path" -ForegroundColor Cyan
        
        # Try to take ownership
        try {
            takeown /f $Path /r /d y 2>$null
            icacls $Path /grant administrators:F /t 2>$null
        } catch {
            Write-Host "Could not take ownership of $Path" -ForegroundColor Red
        }
        
        # Try to remove
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "✅ Successfully removed: $Path" -ForegroundColor Green
        } catch {
            Write-Host "❌ Could not remove: $Path - $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "You may need to restart your computer or close all applications using these files." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Directory not found: $Path" -ForegroundColor Gray
    }
}

# Remove old directories
Remove-LockedDirectory "agent"
Remove-LockedDirectory "server" 
Remove-LockedDirectory "web"

Write-Host ""
Write-Host "🎯 Cleanup completed!" -ForegroundColor Green
Write-Host "If some directories couldn't be removed, please:" -ForegroundColor Yellow
Write-Host "1. Close all applications (VS Code, terminals, etc.)" -ForegroundColor Yellow
Write-Host "2. Restart your computer" -ForegroundColor Yellow
Write-Host "3. Run this script again" -ForegroundColor Yellow
