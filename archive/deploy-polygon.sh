#!/bin/bash
# Automated deployment script for Polygon mainnet using Hardhat
# Usage: bash deploy-polygon.sh

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found! Aborting."
  exit 1
fi

# Check for required env vars
if [ -z "$PRIVATE_KEY" ] || [ -z "$POLYGON_RPC_URL" ]; then
  echo "PRIVATE_KEY or POLYGON_RPC_URL not set in .env! Aborting."
  exit 1
fi

# Compile contracts
npx hardhat compile

# Deploy contracts to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon

# Optionally verify contracts (uncomment if needed)
# npx hardhat verify --network polygon <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

echo "Deployment to Polygon mainnet complete!"