# PowerShell script to automate app store metadata file generation
# Usage: ./generate-metadata.ps1

$ErrorActionPreference = 'Stop'

$metadata = @{
    "app_name" = "Aetheron"
    "short_description" = "Space Exploration & DeFi in your pocket."
    "full_description" = "Aetheron is a next-gen DeFi and space exploration app. Manage your AETH wallet, stake, swap, and track your portfolio on Polygon. Secure, fast, and beautiful."
    "keywords" = "DeFi, crypto, wallet, staking, Polygon, AETH, Web3, space"
    "privacy_policy_url" = "https://mastatrill.github.io/aetheron-platform/privacy"
    "support_email" = "support@aetheron.com"
    "website" = "https://mastatrill.github.io/aetheron-platform"
}

$metadata | ConvertTo-Json -Depth 3 | Out-File -FilePath "store-metadata.json" -Encoding utf8
Write-Host "store-metadata.json generated. Edit as needed for each store submission."