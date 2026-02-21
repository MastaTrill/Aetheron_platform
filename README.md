# 🌌 Aetheron Platform

@MastaTrill

🌌 Aetheron Platform

> Revolutionary Blockchain & Space Exploration Ecosystem

![License: MIT](https://opensource.org/licenses/MIT)
![Build Status](https://github.com/Mastatrill/aetheron-platform)
![Version](https://github.com/Mastatrill/aetheron-platform)

## Deployed Contracts

### Polygon Mumbai Testnet (Chain ID: 80001)

- AETH Token: `0x44F9c15816bCe5d6691448F60DAD50355ABa40b5`
  - View on PolygonScan: [AETH Token on PolygonScan](https://mumbai.polygonscan.com/token/0x44F9c15816bCe5d6691448F60DAD50355ABa40b5)
- Staking Contract: `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
  - View on PolygonScan: [Staking Contract on PolygonScan](https://mumbai.polygonscan.com/address/0x896D9d37A67B0bBf81dde0005975DA7850FFa638)

### Polygon Mainnet (Chain ID: 137)

- AETH Token: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
  - View on PolygonScan: [AETH Token on PolygonScan](https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e)
- Staking Contract: `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
  - View on PolygonScan: [Staking Contract on PolygonScan](https://polygonscan.com/address/0x896D9d37A67B0bBf81dde0005975DA7850FFa638)
- Liquidity Pair: `0xd57c5E33ebDC1b565F99d06809debbf86142705D`
  - View on PolygonScan: [Liquidity Pair on PolygonScan](https://polygonscan.com/address/0xd57c5E33ebDC1b565F99d06809debbf86142705D)

### Solana (if applicable for cross-chain or future features)

- Solana Mint/Wallet/Program: `5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki`
  - View on Solscan: [Solana Account on Solscan](https://solscan.io/account/5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki)

---

🚀 Live Demo

- 🌐 Admin Dashboard: mastatrill.github.io/aetheron-platform
- 📱 Mobile App: Coming soon to App Store & Google Play
- 📖 Documentation: Complete guides and API reference
- 🔗 GitHub Repository: github.com/Mastatrill/aetheron-platform

---

🎯 Features

- 🎯 Mission Control — Participate in space exploration missions
- 💰 AETH Token — Native cryptocurrency with staking rewards
- 📱 Mobile App — iOS/Android cross‑platform application
- 🌐 Web Dashboard — Comprehensive admin and user interface
- ⛓️ Smart Contracts — Secure blockchain infrastructure
- 🔭 Discovery System — Real‑time space exploration tracking

---

🔄 Recent Updates (v2.0.0)

- ✅ **Security Enhancement**: Removed .env from Git history for credential protection
- ✅ **CI/CD Improvements**: Updated CircleCI config to v2.1 standards
- ✅ **Smart Contract Testing**: 35/39 tests passing with gas optimization
- ✅ **Deployment Ready**: Auto-deployment to GitHub Pages and Vercel
- ✅ **Code Quality**: Clean codebase with proper ignores and structure

---

💰 Tokenomics

### AETH Token Specifications

- **Symbol**: AETH
- **Name**: Aetheron
- **Total Supply**: 1,000,000,000 AETH
- **Network**: Polygon Mainnet
- **Contract**: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`

### Tax Structure

- **Buy Tax**: 5%
- **Sell Tax**: 5% (reflected in buy tax for simplicity)
- **Tax Distribution**:
  - 3% - Liquidity Pool
  - 2% - Marketing & Development

### Security Features

- **Blacklist**: Yes - Malicious addresses can be blacklisted
- **Max Transaction**: 1% of total supply per transaction
- **Max Wallet**: 2% of total supply per wallet
- **Anti-Whale Protection**: Enabled

---

🛠️ Technology Stack

Frontend

- React Native (Mobile)
- React.js / Next.js (Web)
- TypeScript
- CSS3 / SCSS

Backend

- Node.js / Express.js
- MongoDB / PostgreSQL
- JWT Authentication
- WebSocket (Real‑time)

Blockchain

- Solidity Smart Contracts
- Hardhat Development Framework
- Polygon / Ethereum Networks
- Web3.js Integration

DevOps

- Docker Containerization
- Kubernetes Orchestration
- GitHub Actions CI/CD
- Terraform Infrastructure

---

📁 Project Structure

`aetheron-platform/
├── admin-dashboard/     # Web admin interface
├── mobile-app/          # React Native mobile app
├── backend-api/         # Node.js API server
├── smart-contracts/     # Solidity blockchain contracts
├── web-frontend/        # React web application
├── documentation/       # Project documentation
├── assets/              # Media and design files
├── deployment/          # Infrastructure configurations
├── testing/             # Test suites
└── tools/               # Development utilities`

---

🔐 Verification

GitHub Owner: @Mastatrill  
Keeper’s Lantern Wallet: 0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82

Proof‑of‑Record Constellation

- Herald’s Seal — Tx Hash: 0xb397…c82c94
- Steward’s Seal — Tx Hash: 0x8a3a…c3452 (Dec‑16‑2025 09:27:45 AM UTC)
- Lantern Seal — Wallet: 0x127C…AF82
- Constellation Seal — Tx Hash: 0x428e…Be3E

✨ Four Seals, One Constellation — Eternal Proof.

---

🗺️ Roadmap

- ✅ Platform structure created
- ✅ Smart contracts drafted (ERC20 upgradeable)
- 🔄 Source code verification on BaseScan/Etherscan
- 🔄 Security audit (third‑party)
- 🔜 Mobile app release (App Store & Google Play)
- 🔜 Exchange listings for AETH token
- 🌌 Expansion into live mission tracking

---

🤝 Contributing
We welcome contributions!

1. Fork the repository
2. Create your feature branch (git checkout -b feature/YourFeature)
3. Commit changes (git commit -m 'Add new feature')
4. Push to branch (git push origin feature/YourFeature)
5. Open a Pull Request

---

📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

---

## 🚀 Production Deployment Checklist

Before deploying Aetheron smart contracts to production, follow this comprehensive checklist to ensure a smooth and error-free deployment.

### Prerequisites

1. **Environment Setup**
   - [ ] Node.js (v16 or higher) installed
   - [ ] npm or yarn installed
   - [ ] Git installed and configured

2. **Required Accounts & Keys**
   - [ ] Metamask or hardware wallet with private key
   - [ ] Polygon RPC endpoint (from Alchemy, Infura, or QuickNode)
   - [ ] PolygonScan API key (for contract verification)
   - [ ] Sufficient POL in deployer wallet (minimum 0.5 POL recommended)

### Step-by-Step Deployment Guide

#### 1. Setup Environment Variables

```bash
cd smart-contract
cp .env.example .env
```

Edit `.env` file and configure the following **required** variables:

```bash
# REQUIRED: Your wallet's private key (must start with 0x)
PRIVATE_KEY=0x...

# REQUIRED: Polygon RPC URL (get from Alchemy, Infura, etc.)
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# REQUIRED: Team wallet address (receives 20% of tokens)
TEAM_WALLET=0x...

# REQUIRED: Marketing wallet address (receives 15% of tokens)
MARKETING_WALLET=0x...

# OPTIONAL: For contract verification on PolygonScan
POLYGONSCAN_API_KEY=your_api_key_here
```

**⚠️ CRITICAL ERRORS TO AVOID:**

- ❌ Private key without `0x` prefix
- ❌ Extra spaces in addresses or keys
- ❌ Using placeholder/example values
- ❌ Incorrect address format (must be 42 characters: 0x + 40 hex)

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Run Pre-Deployment Verification

**This step is MANDATORY** - it validates your configuration and catches errors before deployment:

```bash
node scripts/verify-setup.js
```

The script will check:

- ✓ Environment file exists
- ✓ All required variables are set and properly formatted
- ✓ Network connectivity to Polygon RPC
- ✓ Deployer wallet has sufficient POL balance
- ✓ Wallet addresses are valid

**Do not proceed if any checks fail!** Fix all errors before continuing.

#### 4. Deploy Smart Contracts

Once verification passes, deploy to Polygon Mainnet:

```bash
npx hardhat run scripts/deploy.js --network polygon
```

Or use the enhanced deployment script:

```bash
npx hardhat run scripts/redeploy.js --network polygon
```

**Important:** Save the deployment output! You'll need the contract addresses.

#### 5. Update Environment with Contract Addresses

After deployment, update your `.env` file with the deployed contract address:

```bash
AETH_TOKEN_ADDRESS=0x... # Copy from deployment output
```

#### 6. Verify Contracts on PolygonScan

```bash
npx hardhat verify --network polygon <AETH_TOKEN_ADDRESS> "<TEAM_WALLET>" "<MARKETING_WALLET>" "<STAKING_ADDRESS>"
npx hardhat verify --network polygon <STAKING_ADDRESS> "<AETH_TOKEN_ADDRESS>"
```

#### 7. Enable Trading

```bash
node scripts/enable-trading.js
```

#### 8. Add Liquidity to DEX

```bash
node scripts/add-liquidity.js
```

Or manually via QuickSwap interface: <https://quickswap.exchange/#/pool>

#### 9. Post-Deployment Verification

Run the final deployment check:

```bash
node scripts/final-deployment-check.js
```

### Common Errors & Solutions

| Error                              | Cause                           | Solution                                         |
| ---------------------------------- | ------------------------------- | ------------------------------------------------ |
| `PRIVATE_KEY is not defined`       | Missing or empty .env file      | Copy `.env.example` to `.env` and fill in values |
| `PRIVATE_KEY must start with 0x`   | Missing 0x prefix               | Add `0x` before your private key                 |
| `Invalid address format`           | Wrong address length or format  | Ensure address is 42 characters (0x + 40 hex)    |
| `Insufficient funds for gas`       | Not enough POL in wallet        | Add at least 0.5 POL to deployer wallet          |
| `Cannot connect to RPC`            | Invalid or rate-limited RPC URL | Use a valid RPC from Alchemy/Infura/QuickNode    |
| `AETH_TOKEN_ADDRESS not found`     | Token not deployed yet          | Deploy contracts first, then update .env         |
| `Ownable: caller is not the owner` | Wrong private key in .env       | Use the deployer's private key                   |

### Environment Variable Reference

#### Required Variables

| Variable           | Description                 | Format            | Example                                        |
| ------------------ | --------------------------- | ----------------- | ---------------------------------------------- |
| `PRIVATE_KEY`      | Deployer wallet private key | 0x + 64 hex chars | `0x1234...abcd`                                |
| `POLYGON_RPC_URL`  | Polygon RPC endpoint        | HTTPS URL         | `https://polygon-mainnet.g.alchemy.com/v2/...` |
| `TEAM_WALLET`      | Team wallet address         | 0x + 40 hex chars | `0x1234...5678`                                |
| `MARKETING_WALLET` | Marketing wallet address    | 0x + 40 hex chars | `0xabcd...ef01`                                |

#### Post-Deployment Variables

| Variable                   | Description                       | When to Set               |
| -------------------------- | --------------------------------- | ------------------------- |
| `AETH_TOKEN_ADDRESS`       | Deployed token contract address   | After step 4 (deployment) |
| `STAKING_CONTRACT_ADDRESS` | Deployed staking contract address | After step 4 (deployment) |

#### Optional Variables

| Variable                | Description           | When Needed                        |
| ----------------------- | --------------------- | ---------------------------------- |
| `POLYGONSCAN_API_KEY`   | PolygonScan API key   | For contract verification (step 6) |
| `COINMARKETCAP_API_KEY` | CoinMarketCap API key | For gas reporting in tests         |

### Troubleshooting Guide

#### Verification Script Fails

1. **Check .env file exists**: `ls -la .env`
2. **Verify file contents**: `cat .env` (be careful not to share output!)
3. **Check for hidden characters**: Open in text editor and remove any extra spaces/newlines
4. **Validate each field**: Compare with `.env.example` format

#### Deployment Fails

1. **Check gas balance**: Ensure you have 0.5+ POL
2. **Verify network**: Confirm POLYGON_RPC_URL is for Polygon Mainnet (Chain ID: 137)
3. **Check nonce issues**: Wait 30 seconds and retry
4. **Review transaction**: Check on PolygonScan for revert reason

#### Script Errors

1. **Module not found**: Run `npm install` in smart-contract directory
2. **Cannot find artifact**: Run `npm run compile`
3. **Network timeout**: Check internet connection and RPC endpoint status

### Security Best Practices

- ✅ **NEVER** commit `.env` file to git
- ✅ Use hardware wallet for production deployments
- ✅ Store private keys securely (password manager, hardware wallet)
- ✅ Test on Mumbai testnet before mainnet deployment
- ✅ Verify all addresses before deploying
- ✅ Keep deployment logs for audit trail
- ✅ Use multisig wallet for contract ownership in production

### Quick Start for Experienced Users

```bash
# 1. Setup
cd smart-contract && cp .env.example .env
# Edit .env with your values

# 2. Verify
node scripts/verify-setup.js

# 3. Deploy
npx hardhat run scripts/redeploy.js --network polygon

# 4. Update .env with AETH_TOKEN_ADDRESS

# 5. Enable trading
node scripts/enable-trading.js

# 6. Add liquidity
node scripts/add-liquidity.js
```

### Support

If you encounter issues not covered in this guide:

1. Check existing [GitHub Issues](https://github.com/MastaTrill/Aetheron_platform/issues)
2. Review smart contract [README.md](./smart-contract/README.md)
3. Run verification script for diagnostic info
4. Open a new issue with error details and verification output

---

📞 Contact

- GitHub: @Mastatrill
- Repository: github.com/Mastatrill/aetheron-platform
- Website: mastatrill.github.io/aetheron-platform
- Email: <contact@aetheron.space>

---

⭐ Star us on GitHub if you like this project!  
Created by Mastatrill — Building the future of space exploration 🌌🚀
`

---

✨
