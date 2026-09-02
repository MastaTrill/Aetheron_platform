# ARCHIVED HISTORICAL TOOLING — NOT FOR CURRENT PRODUCTION USE
# Canonical Aetheron production network is Base Mainnet (chain ID 8453).
# This file is preserved only as pre-Base operational history.

# PowerShell script to archive bash script and confirm PowerShell automation
# Usage: ./cleanup-polygon.ps1

$ErrorActionPreference = 'Stop'

# Archive deploy-polygon.sh if it exists
if (Test-Path "deploy-polygon.sh") {
    $archiveDir = "archive"
    if (!(Test-Path $archiveDir)) {
        New-Item -ItemType Directory -Path $archiveDir | Out-Null
    }
    Move-Item "deploy-polygon.sh" "$archiveDir/deploy-polygon.sh"
    Write-Host "deploy-polygon.sh archived to $archiveDir/"
} else {
    Write-Host "deploy-polygon.sh not found or already archived."
}

Write-Host "Cleanup complete. PowerShell automation is now primary."