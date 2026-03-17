# 🚀 Quick Deployment Checklist

## Before You Deploy:

### ✅ Step 1: Configure Your Private Key

Edit `smart-contract/.env` and add your MetaMask private key:

**To export your private key from MetaMask:**

1. Open MetaMask extension
2. Click the three dots (⋮) next to your account
3. Select "Account Details"
4. Click "Export Private Key"
5. Enter your MetaMask password
6. Copy the private key (starts with 0x)
7. Paste it in the `.env` file:

```bash
PRIVATE_KEY=0xYourPrivateKeyHere
```

⚠️ **IMPORTANT:** Never share your private key! Keep the `.env` file secure!

---

### ✅ Step 2: Fund Your Wallet

Your deployer wallet needs POL for gas fees:

**Wallet Address:** `0x8a3ad49656bd07981c9cfc7ad826a808847c3452`
**Current Balance:** ~0.84 POL
**Recommended:** 10-15 POL (deployment costs ~5-8 POL)

**Where to get POL:**

- Buy on exchanges: Binance, Coinbase, Kraken
- Bridge from Ethereum: [Polygon Bridge](https://wallet.polygon.technology/polygon/bridge)
- Use a DEX: Uniswap, QuickSwap

**Send POL to:** `0x8a3ad49656bd07981c9cfc7ad826a808847c3452`

---

### ✅ Step 3: Verify Configuration

Check your settings in `smart-contract/.env`:

```bash
# Should have these values:
PRIVATE_KEY=your_private_key_here
POLYGON_RPC_URL=https://polygon-rpc.com
TEAM_WALLET=0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784
MARKETING_WALLET=0x8a3ad49656bd07981c9cfc7ad826a808847c3452
```

---

## 🚀 Deploy to Polygon Mainnet

### Option 1: Test Locally First (Recommended)

```bash
# Terminal 1 - Start local node
cd smart-contract
npm run node
```

```bash
# Terminal 2 - Deploy locally
cd smart-contract
npx hardhat run scripts/redeploy.js --network localhost
```

### Option 2: Deploy to Polygon Mainnet (Safe Testing)

```bash
# Get free POL from:
# https://faucet.polygon.technology/

cd smart-contract
npx hardhat run scripts/redeploy.js --network polygon
```

### Option 3: Deploy to Polygon Mainnet (PRODUCTION)

⚠️ **This deploys with real tokens and costs real POL!**

```bash
cd smart-contract
npx hardhat run scripts/redeploy.js --network polygon
```

---

## 📊 What Happens During Deployment:

1. **Deploy AETH Token** (1 billion tokens)
   - 500M to deployer (for liquidity)
   - 200M to team wallet
   - 150M to marketing wallet
   - 150M to staking contract

2. **Deploy Staking Contract**
   - 3 pools (30/90/180 days)
   - Rewards deposited automatically

3. **Configure Contracts**
   - Update addresses
   - Exclude from taxes
   - Transfer rewards

4. **Save Deployment Info**
   - Creates `deployment-polygon-[timestamp].json`
   - Contains all contract addresses

---

## ✅ After Deployment:

### 1. Verify Contracts on PolygonScan

The script will give you verification commands like:

```bash
npx hardhat verify --network polygon TOKEN_ADDRESS "TEAM_WALLET" "MARKETING_WALLET" "STAKING_ADDRESS"
npx hardhat verify --network polygon STAKING_ADDRESS "TOKEN_ADDRESS"
```

### 2. Enable Trading

```bash
# Add token address to .env
AETH_TOKEN_ADDRESS=0xYourNewTokenAddress

# Enable trading
node scripts/enable-trading.js
```

### 3. Update Frontend

The deployment will create a JSON file with addresses. Update:

- `src/config/contracts.js`
- `dashboard.html`
- `admin-dashboard.html`
- `README.md`

### 4. Add Liquidity

Use your 500M AETH to create liquidity pool on:

- QuickSwap: https://quickswap.exchange/
- Uniswap (Polygon): https://app.uniswap.org/

---

## 🆘 Common Issues:

### "Insufficient funds for gas"

- Add more POL to your wallet
- Current balance: ~0.84 POL
- Need: ~10 POL minimum

### "Invalid private key"

- Make sure it starts with 0x
- No spaces before/after
- Check you copied the full key

### "Network not configured"

- Check RPC URL in `.env`
- Try alternative: https://polygon-mainnet.g.alchemy.com/v2/demo

### "Deployment failed"

- Check gas price isn't too high
- Verify contract code compiles: `npm run compile`
- Check all dependencies installed: `npm install`

---

## 📞 Ready to Deploy?

Run these commands in order:

```bash
# 1. Navigate to smart-contract folder
cd "c:\Users\willi\OneDrive\Desktop\Aetheron platform\Aetheron_platform\smart-contract"

# 2. Install dependencies (if not done)
npm install

# 3. Compile contracts
npm run compile

# 4. Test deployment locally
npm run node
# (In new terminal)
npx hardhat run scripts/redeploy.js --network localhost

# 5. Deploy to Polygon (when ready)
npx hardhat run scripts/redeploy.js --network polygon
```

---

**Need help?** Check [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for more details.

**Good luck! 🚀**
