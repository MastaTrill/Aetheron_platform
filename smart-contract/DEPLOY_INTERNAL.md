# Aetheron Internal Contracts Deployment Guide

## Overview

This guide deploys the internal smart contracts to Polygon mainnet.

## Contracts to Deploy

| Contract                 | Purpose                    | Priority |
| ------------------------ | -------------------------- | -------- |
| AetheronMultiSigTreasury | Multi-sig treasury wallet  | HIGH     |
| AetheronRetainerVault    | Operational reserves vault | MEDIUM   |

## Prerequisites

1. **Polygon RPC URL** - Get from Alchemy, Infura, or Polygon
2. **Private Key** - Deployer wallet with sufficient MATIC (0.5+ MATIC recommended)
3. **Node.js** installed
4. **Hardhat** dependencies installed

## Setup

```bash
cd smart-contract
npm install
```

## Configure Environment

Create `.env` file in `smart-contract/` folder:

```env
# Required
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=0xyour_private_key_here

# Optional (for other networks)
MUMBAI_RPC_URL=https://rpc-amoy.polygon.technology
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## Deploy Commands

### Deploy MultiSig Treasury (Mainnet)

```bash
npx hardhat run scripts/deploy-upgradeable.js --network polygon
```

### Deploy Retainer Vault

```bash
npx hardhat run scripts/deploy-vault.js --network polygon
```

### Test Deployment (Mumbai Testnet)

```bash
npx hardhat run scripts/deploy-upgradeable.js --network mumbai
```

## Deployment Checklist

- [ ] Verify private key is set in .env
- [ ] Confirm deployer wallet has MATIC for gas
- [ ] Review contract addresses in scripts
- [ ] Run on testnet first (mumbai)
- [ ] Verify deployment on PolygonScan
- [ ] Update CONTRACT_ADDRESSES.md with new addresses

## Expected Output

After deployment, you'll see:

```
AetheronMultiSigTreasury (proxy) deployed to: 0x...
Implementation address: 0x...
```

## Post-Deployment

1. **Verify contracts** on PolygonScan
2. **Update documentation** with new addresses
3. **Set up multi-sig owners** if needed
4. **Fund the treasury** with initial tokens if desired
