# Aetheron Smart Contracts

Smart contracts for the Aetheron Platform - Revolutionary Blockchain & Space Exploration Ecosystem.

## Contracts

### Aetheron (AETH) Token
ERC20 token with:
- **Total Supply**: 1,000,000,000 AETH
- **Tax System**: Configurable buy/sell taxes
- **Distribution**: 
  - 50% Liquidity Pool
  - 20% Team Allocation
  - 15% Marketing
  - 15% Staking Rewards
- **Features**:
  - Trading control (enable/disable)
  - Tax exclusion list
  - Blacklist functionality
  - Emergency token rescue

### AetheronStaking
Staking contract with:
- **Multiple Pools**: Different lock periods and APY rates
- **Default Pools**:
  - 30 days @ 5% APY
  - 90 days @ 12% APY
  - 180 days @ 25% APY
- **Features**:
  - Flexible staking periods
  - Automatic reward calculation
  - Claim rewards independently
  - Multiple stakes per user

## Setup

### Install Dependencies
```bash
npm install
```

### Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
- `PRIVATE_KEY`: Your wallet private key for deployment (must start with 0x)
- `POLYGON_RPC_URL`: Polygon RPC endpoint
- `POLYGONSCAN_API_KEY`: For contract verification
- `TEAM_WALLET`: Team wallet address (must be valid Ethereum address)
- `MARKETING_WALLET`: Marketing wallet address (must be valid Ethereum address)

### Verify Configuration

**IMPORTANT:** Always run the verification script before deploying to catch configuration errors:

```bash
node scripts/verify-setup.js
```

This script checks:
- ✓ Environment file exists and is properly formatted
- ✓ All required variables are set
- ✓ Private key format is valid (0x prefix, correct length)
- ✓ Wallet addresses are valid Ethereum addresses
- ✓ Network connectivity to Polygon RPC
- ✓ Deployer wallet has sufficient POL for gas fees
- ✓ Optional configurations are noted

**Example output:**
```
🔍 AETHERON PLATFORM - SETUP VERIFICATION
═══════════════════════════════════════════════════════════════════

📋 Step 1: Environment File Check
──────────────────────────────────────────────────────────────────
  ✓ PASS  Environment file (.env) exists

🔑 Step 2: Environment Variables Validation
──────────────────────────────────────────────────────────────────
  ✓ PASS  PRIVATE_KEY
  ✓ PASS  POLYGON_RPC_URL
  ✓ PASS  TEAM_WALLET
  ✓ PASS  MARKETING_WALLET

🌐 Step 3: Network Connectivity Check
──────────────────────────────────────────────────────────────────
  ✓ PASS  Polygon RPC connection
  ✓ PASS  Network verification (Polygon Mainnet)

💰 Step 4: Wallet Balance Check
──────────────────────────────────────────────────────────────────
  ✓ PASS  Deployer wallet balance

═══════════════════════════════════════════════════════════════════
📊 VERIFICATION SUMMARY
═══════════════════════════════════════════════════════════════════

  ✓ Passed:  12
  ✗ Failed:  0
  ⚠ Warnings: 2

🎉 ALL CRITICAL CHECKS PASSED!
```

If any checks fail, the script will provide detailed error messages and solutions.

## Development

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Run Local Node
```bash
npm run node
```

## Deployment

### Pre-Deployment Checklist

Before deploying, ensure:
1. ✅ You have run `node scripts/verify-setup.js` and all checks passed
2. ✅ Your deployer wallet has at least 0.5 POL for gas
3. ✅ All environment variables are correctly configured
4. ✅ You have tested on Mumbai testnet (optional but recommended)

### Deploy to Local Network
```bash
npm run deploy:local
```

### Deploy to Mumbai Testnet
```bash
npm run deploy:mumbai
```

### Deploy to Polygon Mainnet

**Step 1: Verify Setup**
```bash
node scripts/verify-setup.js
```

**Step 2: Deploy Contracts**
```bash
npm run deploy:polygon
# or
npx hardhat run scripts/redeploy.js --network polygon
```

The deployment script will:
- Validate your configuration
- Check wallet balances
- Deploy Aetheron token contract
- Deploy Aetheron staking contract
- Configure contracts (set wallets, deposit rewards, exclude from tax)
- Save deployment information to JSON file

**Step 3: Update .env**

After deployment, update your `.env` file with the deployed contract address:
```bash
AETH_TOKEN_ADDRESS=0x... # Copy from deployment output
```

### Verify Contracts
After deployment, verify on block explorer:
```bash
npm run verify:polygon -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Example:**
```bash
npx hardhat verify --network polygon 0xYourTokenAddress "0xTeamWallet" "0xMarketingWallet" "0xStakingAddress"
npx hardhat verify --network polygon 0xYourStakingAddress "0xYourTokenAddress"
```

## Contract Addresses

### Mainnet (Polygon)
- **AETH Token**: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- **Staking Contract**: `0x8a3ad49656bd07981c9cfc7ad826a808847c3452`

### Testnet (Mumbai)
- TBD

## Post-Deployment Steps

1. **Update Environment Variables**
   ```bash
   # Add to .env after deployment
   AETH_TOKEN_ADDRESS=0xYourDeployedTokenAddress
   STAKING_CONTRACT_ADDRESS=0xYourDeployedStakingAddress
   ```

2. **Enable Trading**
   ```bash
   node scripts/enable-trading.js
   ```
   
   This enables buying/selling of AETH tokens. Only the contract owner can call this function.

3. **Add Liquidity to DEX**
   
   Option A: Use the automated script
   ```bash
   node scripts/add-liquidity.js
   ```
   
   Option B: Manual via QuickSwap
   - Visit https://quickswap.exchange/#/pool
   - Connect your wallet
   - Add liquidity for AETH/WMATIC pair
   - Recommended initial liquidity: 1,000 AETH + equivalent POL

4. **Fund Team/Marketing Wallets** (Optional)
   ```bash
   node fund-wallets.js
   ```
   
   Sends initial POL and AETH to team and marketing wallets for operations.

5. **Verify Deployment Status**
   ```bash
   node scripts/final-deployment-check.js
   ```
   
   Verifies all contracts are properly deployed and configured.

6. **Configure Tax Exclusions** (if needed)
   ```javascript
   await aetheronToken.setExcludedFromTax(dexRouter, true);
   await aetheronToken.setExcludedFromTax(stakingAddress, true);
   ```

7. **Update Frontend**
   - Update contract addresses in frontend config
   - Update ABIs from `artifacts/` directory
   - Test all frontend interactions

## Common Errors & Troubleshooting

### Configuration Errors

**Error:** `PRIVATE_KEY is not defined`
- **Cause:** Missing or empty .env file
- **Solution:** Copy `.env.example` to `.env` and fill in your values

**Error:** `PRIVATE_KEY must start with 0x`
- **Cause:** Missing 0x prefix on private key
- **Solution:** Add `0x` before your private key in .env

**Error:** `Invalid address format`
- **Cause:** Wallet address is wrong length or format
- **Solution:** Ensure address is 42 characters (0x + 40 hex characters)

### Deployment Errors

**Error:** `Insufficient funds for gas`
- **Cause:** Not enough POL in deployer wallet
- **Solution:** Add at least 0.5 POL to your deployer wallet

**Error:** `Cannot connect to RPC`
- **Cause:** Invalid RPC URL or network issues
- **Solution:** 
  - Check POLYGON_RPC_URL in .env
  - Try alternative RPC (Alchemy, Infura, QuickNode)
  - Verify internet connection

**Error:** `Nonce too high` or `Nonce too low`
- **Cause:** Transaction nonce conflict
- **Solution:** Wait 30 seconds and try again

**Error:** `Transaction reverted`
- **Cause:** Various - check specific revert reason
- **Solution:** 
  - Review transaction on PolygonScan
  - Check function parameters
  - Ensure sufficient token/POL balances

### Post-Deployment Errors

**Error:** `AETH_TOKEN_ADDRESS not found`
- **Cause:** Trying to run post-deployment script before deployment
- **Solution:** Deploy contracts first, then update AETH_TOKEN_ADDRESS in .env

**Error:** `Ownable: caller is not the owner`
- **Cause:** Using wrong private key for owner-only functions
- **Solution:** Use the deployer's private key in .env

**Error:** `Insufficient AETH balance`
- **Cause:** Not enough AETH tokens for operation (liquidity, transfers)
- **Solution:** Ensure you have enough AETH in your wallet from deployment

### Script Errors

**Error:** `Cannot find module`
- **Cause:** Dependencies not installed
- **Solution:** Run `npm install` in smart-contract directory

**Error:** `HH12: Cannot find artifact`
- **Cause:** Contracts not compiled
- **Solution:** Run `npm run compile`

**Error:** `Network not found`
- **Cause:** Network configuration missing or typo
- **Solution:** Check hardhat.config.js and .env for correct network names

## Diagnostic Commands

```bash
# Check if .env file exists and has content
ls -la .env

# Verify compiled contracts exist
ls -la artifacts/contracts/

# Check deployer wallet balance on Polygon
# (requires polygonscan API key)
node scripts/check-status.js

# Verify setup before deployment
node scripts/verify-setup.js

# Check trading status after deployment
node scripts/check-trading-status.js
```

## Security Checklist

Before production deployment:
- [ ] Private keys stored securely (not in code/git)
- [ ] .env file added to .gitignore
- [ ] All wallet addresses verified and double-checked
- [ ] Sufficient POL in deployer wallet (0.5+ recommended)
- [ ] Tested deployment on Mumbai testnet first
- [ ] Contract addresses saved and backed up
- [ ] PolygonScan verification completed
- [ ] Team and marketing wallets confirmed correct
- [ ] Trading only enabled when ready
- [ ] Initial liquidity planned and ready
- [ ] Frontend updated with correct addresses

## Security

- Contracts use OpenZeppelin's audited libraries
- ReentrancyGuard on sensitive functions
- Access control with Ownable
- SafeERC20 for token transfers

## Testing

Tests cover:
- Token deployment and distribution
- Trading controls
- Tax system
- Staking mechanics
- Reward calculations
- Edge cases and security

## Gas Optimization

- Optimizer enabled with 200 runs
- Efficient storage packing
- Batch operations where possible

## Support

For issues and questions:
- GitHub Issues: https://github.com/MastaTrill/Aetheron_platform/issues
- Documentation: Full guides in main README

## License

MIT License - see LICENSE file for details
