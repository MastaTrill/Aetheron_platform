# PowerShell script to verify deployed contract on Polygon mainnet using Hardhat
# Usage: ./verify-polygon.ps1 <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

param(
    [Parameter(Mandatory=$true)]
    [string]$ContractAddress,
    [Parameter(Mandatory=$false)]
    [string[]]$ConstructorArgs
)

$ErrorActionPreference = 'Stop'

if (!(Test-Path ".env")) {
    Write-Error ".env file not found! Aborting."
    exit 1
}

# Build the verify command
$verifyCmd = "npx hardhat verify --network polygon $ContractAddress"
if ($ConstructorArgs) {
    $verifyCmd += " " + ($ConstructorArgs -join ' ')
}

Invoke-Expression $verifyCmd

Write-Host "Verification complete!"