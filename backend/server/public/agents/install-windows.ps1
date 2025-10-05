$ErrorActionPreference = "Stop"
param(
  [string]$ServerUrl = "https://deployhub-backend.onrender.com"
)
Write-Host "Installing DeployHub Agent..."
Write-Host "Connecting to server: $ServerUrl"
Set-Location "$PSScriptRoot\..\..\..\agent"
npm install
$env:SERVER_URL=$ServerUrl
$env:AGENT_NAME="Windows-Agent-$(hostname)"
Write-Host "Starting agent with name: $env:AGENT_NAME"
npm start

