# PowerShell deployment script for Polygon mainnet using Hardhat
# Usage: Right-click and run with PowerShell, or run: ./deploy-polygon.ps1

# Ensure script stops on error
$ErrorActionPreference = 'Stop'

# Check for .env file
if (!(Test-Path ".env")) {
    Write-Error ".env file not found! Aborting."
    exit 1
}

# Compile contracts
npx hardhat compile

# Deploy contracts to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon

Write-Host "Deployment to Polygon mainnet complete!"