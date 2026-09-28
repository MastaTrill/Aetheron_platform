# Local Deployment Guide


> [!WARNING]
> **Production notice:** this document contains legacy Polygon / QuickSwap material. Do not treat those references as the current production path.
> The canonical production network is **Base Mainnet (Chain ID 8453)**. Current AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`. The recorded Base presale has ended, refunds are available, and no canonical Base liquidity pool is live.
> For current truth, use [`README.md`](./README.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md), [`docs/PRODUCTION_READINESS_EVIDENCE.md`](./docs/PRODUCTION_READINESS_EVIDENCE.md), and the machine-readable Base deployment records under `smart-contract/deployments/`.

## ✅ Completed Steps

1. ✅ All test files updated for ethers.js v6
2. ✅ All 27 tests passing
3. ✅ Local Hardhat node running at http://127.0.0.1:8545

## 🚀 Quick Start

### 1. Deploy Contracts Locally

Open a new terminal and run:

```bash
cd "c:\Users\willi\OneDrive\Desktop\Aetheron platform\Aetheron_platform\smart-contract"
npx hardhat run scripts/deploy.js --network localhost
```

This will:

- Deploy Aetheron Token
- Deploy Staking Contract
- Configure tax exclusions
- Transfer staking rewards
- Save deployment addresses to `deployment.json`

### 2. Copy Contract Addresses

After deployment, copy the addresses from terminal output and update:

**File:** `src/config/contracts.js`

```javascript
local: {
  AETH_TOKEN: '0x...', // Copy from deployment output
  STAKING: '0x...',    // Copy from deployment output
},
```

### 3. Start Frontend

```bash
cd "c:\Users\willi\OneDrive\Desktop\Aetheron platform\Aetheron_platform"
npm run dev
```

### 4. Connect MetaMask to Local Network

- Network Name: Hardhat Local
- RPC URL: http://127.0.0.1:8545
- Chain ID: 1337
- Currency: ETH

**Import Test Account:**

- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- This account has 10,000 ETH and the deployed tokens

### 5. Test Features

- ✅ Connect wallet
- ✅ View AETH balance
- ✅ Transfer tokens
- ✅ Approve staking contract
- ✅ Stake tokens (3 pools available)
- ✅ View staking rewards
- ✅ Unstake tokens

## 📦 Available Test Accounts

The Hardhat node provides 20 accounts, each with 10,000 ETH:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

_See terminal output for all 20 accounts_

## 🔧 Troubleshooting

### Contract deployment fails

- Ensure Hardhat node is running
- Check no other process is using port 8545

### Frontend can't connect

- Verify contract addresses are updated in `src/config/contracts.js`
- Check MetaMask is connected to localhost:8545
- Ensure NEXT_PUBLIC_CHAIN_ID is set to 1337

### Reset local blockchain

```bash
# Stop the current node (Ctrl+C)
# Restart fresh
npx hardhat node
# Re-deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

## 📊 Expected Deployment Output

```
🚀 Deploying Aetheron Platform Contracts...
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📜 Deploying Aetheron Token...
✅ Aetheron Token deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📜 Deploying Aetheron Staking...
✅ Aetheron Staking deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

🔄 Updating staking pool address...
✅ Staking pool address updated

💰 Transferring tokens to staking contract...
💰 Depositing rewards into staking contract...
✅ Rewards deposited

🔧 Configuring token contract...
✅ Staking contract excluded from tax

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================
```

## 🌐 Next: Mainnet Deployment

Once local testing is complete:

1. Get ETH/MATIC from faucet
2. Update `.env` with your private key
3. Deploy to Polygon Mainnet:
   ```bash

   ```

# ...existing code...

```
4. Verify contracts on block explorer
5. Update frontend config with mainnet addresses

## ⚠️ Important Notes

- Never commit `.env` file with real private keys
- Test thoroughly on local/mainnet before mainnet
- Local blockchain resets on restart (all data lost)
- Use test accounts only for development
```
