# Testnet Deployment Guide


> [!WARNING]
> **Production notice:** this document contains legacy Polygon / QuickSwap material. Do not treat those references as the current production path.
> The canonical production network is **Base Mainnet (Chain ID 8453)**. Current AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`. The recorded Base presale has ended, refunds are available, and no canonical Base liquidity pool is live.
> For current truth, use [`README.md`](./README.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md), [`docs/PRODUCTION_READINESS_EVIDENCE.md`](./docs/PRODUCTION_READINESS_EVIDENCE.md), and the machine-readable Base deployment records under `smart-contract/deployments/`.

## Prerequisites

- [ ] Local testing completed successfully
- [ ] MetaMask installed and configured
- [ ] Testnet funds obtained (MATIC/ETH)
- [ ] RPC endpoints configured

## 🌍 Testnet Options

### Option 1: Mumbai (Polygon Testnet) - RECOMMENDED
- **Chain ID:** 80001
- **RPC:** https://rpc-mumbai.maticvigil.com
- **Explorer:** https://mumbai.polygonscan.com
- **Faucet:** https://faucet.polygon.technology/

### Option 2: Sepolia (Ethereum Testnet)
- **Chain ID:** 11155111  
- **RPC:** https://rpc.sepolia.org
- **Explorer:** https://sepolia.etherscan.io
- **Faucet:** https://sepoliafaucet.com/

## 📝 Step-by-Step Deployment

### 1. Get Testnet Funds

**For Mumbai:**
1. Go to https://faucet.polygon.technology/
2. Select "Mumbai"
3. Enter your wallet address
4. Confirm and wait for funds (~0.5 MATIC)

**For Sepolia:**
1. Go to https://sepoliafaucet.com/
2. Sign in with Alchemy account
3. Enter your wallet address
4. Receive 0.5 ETH

### 2. Configure Environment

Create `.env` file in `smart-contract/` directory:

```bash
# Your deployment wallet private key (export from MetaMask)
PRIVATE_KEY= 23c7cf05efd55c56e4bf5b9ac29e3e187436ea8561f8cdf554316bc55536c5b3

# RPC URLs
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Block explorer API keys (for contract verification)
POLYGONSCAN_API_KEY=your_api_key
ETHERSCAN_API_KEY=Z3I7GY96MDGS5AU6FUFF32FA54V8EWXGNB

# Wallet addresses for tax distribution
TEAM_WALLET=0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784
MARKETING_WALLET=0x8a3ad49656bd07981c9cfc7ad826a808847c3452
```

⚠️ **NEVER commit the .env file to git!**

### 3. Update hardhat.config.js (if needed)

Verify network configuration in `hardhat.config.js`:

```javascript
networks: {
  mumbai: {
    url: process.env.MUMBAI_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 80001,
  },
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 11155111,
  },
}
```

### 4. Deploy to Testnet

**Mumbai:**
```bash
cd smart-contract
npx hardhat run scripts/deploy.js --network mumbai
```

**Sepolia:**
```bash
cd smart-contract
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
🚀 Deploying Aetheron Platform Contracts...
Deploying contracts with account: 0x...
Account balance: ...

📜 Deploying Aetheron Token...
✅ Aetheron Token deployed to: 0x...

📜 Deploying Aetheron Staking...
✅ Aetheron Staking deployed to: 0x...

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

📋 Contract Addresses:
  AETH Token: 0x...
  Staking Contract: 0x...
```

### 5. Verify Contracts on Block Explorer

**Get API Key:**
- Mumbai: https://polygonscan.com/apis
- Sepolia: https://etherscan.io/apis

**Verify Aetheron Token:**
```bash
npx hardhat verify --network mumbai <TOKEN_ADDRESS> <TEAM_WALLET> <MARKETING_WALLET> <STAKING_ADDRESS>
```

**Verify Staking Contract:**
```bash
npx hardhat verify --network mumbai <STAKING_ADDRESS> <TOKEN_ADDRESS>
```

### 6. Update Frontend Configuration

Edit `src/config/contracts.js`:

```javascript
// For Mumbai
mumbai: {
  AETH_TOKEN: '0x...', // From deployment output
  STAKING: '0x...',    // From deployment output
},

// Or for Sepolia
sepolia: {
  AETH_TOKEN: '0x...',
  STAKING: '0x...',
},
```

Add Sepolia network if using it:
```javascript
export const NETWORKS = {
  // ... existing networks
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};
```

### 7. Configure MetaMask for Testnet

**Mumbai:**
- Network Name: Mumbai Testnet
- RPC URL: https://rpc-mumbai.maticvigil.com
- Chain ID: 80001
- Currency: MATIC
- Block Explorer: https://mumbai.polygonscan.com

**Sepolia:**
- Network Name: Sepolia Testnet
- RPC URL: https://rpc.sepolia.org
- Chain ID: 11155111
- Currency: ETH
- Block Explorer: https://sepolia.etherscan.io

### 8. Test on Frontend

1. Start frontend:
   ```bash
   npm run dev
   ```

2. Connect MetaMask to testnet

3. Import tokens to MetaMask:
   - Token Address: (from deployment)
   - Symbol: AETH
   - Decimals: 18

4. Test all features:
   - ✅ View token balance
   - ✅ Transfer tokens
   - ✅ Approve staking
   - ✅ Stake tokens
   - ✅ View rewards
   - ✅ Claim rewards
   - ✅ Unstake

## 🔍 Post-Deployment Checklist

- [ ] Contracts deployed successfully
- [ ] deployment.json file created
- [ ] Contracts verified on block explorer
- [ ] Frontend config updated
- [ ] MetaMask configured for testnet
- [ ] Token added to MetaMask
- [ ] All features tested
- [ ] Trading enabled: `await aetheron.enableTrading()`
- [ ] Documentation updated with contract addresses

## 📊 Token Distribution (Testnet)

```
Total Supply: 1,000,000,000 AETH

Distribution:
├── Liquidity Pool (50%): 500,000,000 → Deployer
├── Team Wallet (20%): 200,000,000 → TEAM_WALLET
├── Marketing (15%): 150,000,000 → MARKETING_WALLET
└── Staking Rewards (15%): 150,000,000 → Staking Contract
```

## 🎯 Testing Scenarios

### Basic Token Operations
1. Transfer tokens between accounts
2. Check balances update correctly
3. Verify tax deductions on transfers

### Staking Operations
1. Approve tokens for staking
2. Stake in Pool 0 (30 days, 5% APY)
3. Stake in Pool 1 (90 days, 12% APY)  
4. Stake in Pool 2 (180 days, 25% APY)
5. Check reward calculations
6. Fast-forward time (testnet)
7. Claim rewards
8. Unstake tokens

### Edge Cases
1. Try unstaking before lock period
2. Stake with zero amount
3. Transfer to blacklisted address
4. Trade before trading enabled

## 🐛 Common Issues

### Insufficient funds
- Get more testnet funds from faucet
- Check you're on correct network

### Transaction fails
- Increase gas limit
- Check contract addresses are correct
- Ensure trading is enabled

### Contract verification fails
- Check constructor arguments match deployment
- Verify API key is correct
- Use correct compiler version (0.8.20)

### Frontend can't connect
- Verify NEXT_PUBLIC_CHAIN_ID matches testnet
- Check RPC endpoint is accessible
- Refresh MetaMask connection

## 🚀 Next: Mainnet Preparation

Before mainnet deployment:

1. ✅ Complete all testnet testing
2. ✅ Security audit (recommended)
3. ✅ Liquidity pool planning
4. ✅ Marketing strategy
5. ✅ Community building
6. ✅ Legal compliance review
7. ✅ Mainnet deployment wallet funded
8. ✅ Emergency procedures documented

## 📞 Support Resources

- Polygon Faucet: https://faucet.polygon.technology/
- Mumbai Explorer: https://mumbai.polygonscan.com
- Sepolia Explorer: https://sepolia.etherscan.io
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org/v6/
