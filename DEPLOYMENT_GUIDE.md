# 🚀 Aetheron Platform - Complete Deployment Guide

## ⚠️ Current Status

Your contracts were previously deployed to Polygon but appear incomplete:
- **Token Contract:** `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784` (deployed but empty)
- **Deployer Wallet:** `0x8a3ad49656bd07981c9cfc7ad826a808847c3452` (active, ~$1 balance)

## 🔧 How to Fix - Complete Redeployment

### Step 1: Setup Environment

1. **Configure your .env file** in the `smart-contract` folder:

```bash
# Your deployment wallet private key (DO NOT SHARE!)
PRIVATE_KEY=your_private_key_from_metamask

# RPC URLs
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# Optional: Block Explorer API Keys for verification
POLYGONSCAN_API_KEY=your_api_key_here

# Wallet addresses
TEAM_WALLET=0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784
MARKETING_WALLET=0x8a3ad49656bd07981c9cfc7ad826a808847c3452
```

2. **Get your private key from MetaMask:**
   - Open MetaMask
   - Click the three dots → Account Details → Export Private Key
   - Enter your password and copy the key
   - Paste it in the `.env` file

3. **Fund your deployer wallet:**
   - Minimum required: ~5-10 POL (for gas fees)
   - Send POL to: `0x8a3ad49656bd07981c9cfc7ad826a808847c3452`

### Step 2: Install Dependencies

```bash
cd smart-contract
npm install
```

### Step 3: Test Locally (Recommended)

```bash
# Start local Hardhat node
npm run node

# In a new terminal, deploy locally
npm run deploy:local
```

### Step 4: Deploy to Mumbai Testnet (Recommended First)

```bash
# Get testnet POL from: https://faucet.polygon.technology/
npm run deploy:mumbai
```

### Step 5: Deploy to Polygon Mainnet

```bash
npm run deploy:polygon
```

Or use the new improved script:

```bash
npx hardhat run scripts/redeploy.js --network polygon
```

### Step 6: Verify Contracts on PolygonScan

After deployment, you'll get verification commands. Run them:

```bash
npx hardhat verify --network polygon TOKEN_ADDRESS "TEAM_WALLET" "MARKETING_WALLET" "STAKING_ADDRESS"
npx hardhat verify --network polygon STAKING_ADDRESS "TOKEN_ADDRESS"
```

### Step 7: Enable Trading

After everything is verified and ready:

1. Update `.env` with your token address:
```bash
AETH_TOKEN_ADDRESS=0xYourNewTokenAddress
```

2. Enable trading:
```bash
node scripts/enable-trading.js
```

## 📊 What Gets Deployed

### Aetheron Token (AETH)
- **Total Supply:** 1,000,000,000 AETH
- **Distribution:**
  - 50% (500M) → Deployer wallet (for liquidity)
  - 20% (200M) → Team wallet
  - 15% (150M) → Marketing wallet
  - 15% (150M) → Staking contract

### Staking Contract
- **3 Pools:**
  - Pool 0: 30 days @ 5% APY
  - Pool 1: 90 days @ 12% APY
  - Pool 2: 180 days @ 25% APY

## 🔍 Verify Deployment

Check your addresses on PolygonScan:
- Token: `https://polygonscan.com/address/YOUR_TOKEN_ADDRESS`
- Staking: `https://polygonscan.com/address/YOUR_STAKING_ADDRESS`

Verify token supply:
- Team balance should be 200M AETH
- Marketing balance should be 150M AETH
- Staking contract should have 150M AETH
- Your deployer wallet should have 500M AETH

## 💧 Next Steps After Deployment

1. **Add Liquidity to DEX**
   - Go to QuickSwap or Uniswap (Polygon)
   - Use your 500M AETH to create liquidity pool
   - Pair with MATIC or USDC

2. **Update Frontend**
   - Update contract addresses in `src/config/contracts.js`
   - Update README.md with new addresses

3. **Marketing & Launch**
   - Announce token address
   - Submit to CoinGecko/CoinMarketCap
   - Create social media presence

## ⚠️ Important Security Notes

- **NEVER** commit your `.env` file to git
- **BACKUP** your private key securely
- **TEST** on Mumbai testnet first
- **VERIFY** all contracts on PolygonScan
- **AUDIT** contracts before mainnet deployment (recommended)

## 🆘 Troubleshooting

### "Insufficient funds for gas"
- Add more POL to your deployer wallet

### "Cannot find module '@openzeppelin/contracts'"
- Run `npm install` in the smart-contract folder

### "Network not found"
- Check your RPC URL in `.env`
- Try alternative RPC: `https://polygon-rpc.com`

### Deployment succeeds but tokens not showing
- Check the deployment JSON file for addresses
- Verify on PolygonScan that transactions went through
- Check token balances directly on blockchain explorer

## 📞 Support

- GitHub Issues: https://github.com/MastaTrill/Aetheron_platform/issues
- Documentation: Check other `.md` files in this repo

---

**Good luck with your deployment! 🚀**
