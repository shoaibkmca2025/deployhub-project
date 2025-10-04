$ErrorActionPreference = "Stop"
param(
  [string]$ServerUrl = "http://localhost:4000"
)
Write-Host "Installing DeployHub Agent..."
Set-Location "$PSScriptRoot\..\..\..\agent"
npm install
$env:SERVER_URL=$ServerUrl
npm start

