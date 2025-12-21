# PowerShell script to automate full Polygon deployment, verification, and status update
# Usage: ./finish-polygon.ps1 <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

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

# Compile and deploy
npx hardhat compile
npx hardhat run scripts/deploy.js --network polygon

# Verify contract
$verifyCmd = "npx hardhat verify --network polygon $ContractAddress"
if ($ConstructorArgs) {
    $verifyCmd += " " + ($ConstructorArgs -join ' ')
}
Invoke-Expression $verifyCmd

# Update FINAL_STATUS.md
$polygonscanUrl = "https://polygonscan.com/address/$ContractAddress"
$status = @"
## Polygon Mainnet Deployment Status

- Contract Address: $ContractAddress
- Polygonscan: $polygonscanUrl
- Deployment Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- Verification: Complete

"@

$status | Out-File -FilePath FINAL_STATUS.md -Encoding utf8 -Append

Write-Host "All steps complete! FINAL_STATUS.md updated."