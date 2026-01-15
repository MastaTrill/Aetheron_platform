# Aetheron Platform - Final Deployment Verification Guide

This guide provides a comprehensive checklist and verification procedures for Aetheron Platform production deployment.

## Pre-Deployment Phase

### 1. Environment Setup Verification

**Run the setup verification script:**
```bash
cd smart-contract
node scripts/verify-setup.js
```

**Expected Output:** All checks should pass (✓ PASS)

The script verifies:
- [x] Environment file (.env) exists
- [x] PRIVATE_KEY is set and properly formatted (0x + 64 hex chars)
- [x] POLYGON_RPC_URL is set and accessible
- [x] TEAM_WALLET is a valid address
- [x] MARKETING_WALLET is a valid address
- [x] Network connectivity to Polygon Mainnet (Chain ID: 137)
- [x] Deployer wallet has sufficient POL (minimum 0.1, recommended 0.5+)

**If any checks fail:**
1. Review the error message and suggested solution
2. Fix the configuration issue in .env
3. Re-run the verification script
4. **DO NOT PROCEED** until all checks pass

### 2. Configuration Review

Review your `.env` file and confirm:

```bash
# Required Configuration
PRIVATE_KEY=0x... # 66 characters (0x + 64 hex)
POLYGON_RPC_URL=https://... # Valid HTTPS URL
TEAM_WALLET=0x... # 42 characters (0x + 40 hex)
MARKETING_WALLET=0x... # 42 characters (0x + 40 hex)

# Optional but Recommended
POLYGONSCAN_API_KEY=... # For contract verification
```

### 3. Wallet Preparation

- [ ] Deployer wallet has 0.5+ POL for gas
- [ ] Team wallet address is correct and controlled by team
- [ ] Marketing wallet address is correct and controlled by marketing team
- [ ] Backup of private key stored securely (password manager, hardware wallet)
- [ ] .env file is NOT committed to git

### 4. Dependencies Check

```bash
# Install all dependencies
npm install

# Compile contracts
npm run compile

# Run tests (optional but recommended)
npm test
```

## Deployment Phase

### Step 1: Run Pre-Deployment Verification

```bash
node scripts/verify-setup.js
```

Wait for **"🎉 ALL CRITICAL CHECKS PASSED!"** message before proceeding.

### Step 2: Deploy Smart Contracts

```bash
npx hardhat run scripts/redeploy.js --network polygon
```

**Monitor the deployment output carefully:**

Expected stages:
1. ✓ Configuration validation
2. ✓ Aetheron Token deployment
3. ✓ Aetheron Staking deployment
4. ✓ Contract configuration (wallets, rewards, tax)
5. ✓ Verification of deployment

**Save the output!** You'll need:
- AETH Token address
- Staking Contract address
- Transaction hashes
- Deployment timestamp

### Step 3: Update Environment with Contract Addresses

Edit your `.env` file and add:

```bash
AETH_TOKEN_ADDRESS=0x... # From deployment output
STAKING_CONTRACT_ADDRESS=0x... # From deployment output
```

### Step 4: Verify Contracts on PolygonScan

```bash
# Verify token contract
npx hardhat verify --network polygon <AETH_TOKEN_ADDRESS> "<TEAM_WALLET>" "<MARKETING_WALLET>" "<STAKING_ADDRESS>"

# Verify staking contract
npx hardhat verify --network polygon <STAKING_ADDRESS> "<AETH_TOKEN_ADDRESS>"
```

Wait for verification to complete on PolygonScan.

## Post-Deployment Phase

### Step 5: Enable Trading

```bash
node scripts/enable-trading.js
```

**Expected output:**
- Current status shows "DISABLED"
- Transaction submitted and confirmed
- New status shows "ENABLED"

**⚠️ WARNING:** Once trading is enabled, it CANNOT be disabled!

### Step 6: Add Initial Liquidity

**Option A: Automated Script**
```bash
node scripts/add-liquidity.js
```

**Option B: Manual via QuickSwap**
1. Visit https://quickswap.exchange/#/pool
2. Connect wallet with deployer account
3. Select "Add Liquidity"
4. Choose AETH token (paste contract address)
5. Pair with WMATIC
6. Enter amounts (recommended: 1000+ AETH with equivalent POL)
7. Approve and confirm transaction

### Step 7: Final Verification

```bash
node scripts/final-deployment-check.js
```

**Verify the following:**

Contract Configuration:
- [x] Token name is "Aetheron"
- [x] Token symbol is "AETH"
- [x] Total supply is 1,000,000,000 AETH
- [x] Trading is enabled
- [x] Owner is correct
- [x] Team wallet matches configuration
- [x] Marketing wallet matches configuration

Token Distribution:
- [x] Deployer has ~500M AETH (for liquidity)
- [x] Team wallet has 200M AETH (20%)
- [x] Marketing wallet has 150M AETH (15%)
- [x] Staking contract has 150M AETH (15%)

Staking Configuration:
- [x] Staking token is AETH
- [x] Staking owner is correct
- [x] 3 staking pools created (30d, 90d, 180d)
- [x] Reward balance is 150M AETH

### Step 8: Fund Operational Wallets (Optional)

If team/marketing wallets need POL for operations:

```bash
node fund-wallets.js
```

This sends 1 POL + 1000 AETH to each wallet for testing/operations.

## Verification Checklist

### Smart Contract Verification

- [ ] Token contract deployed successfully
- [ ] Staking contract deployed successfully
- [ ] Both contracts verified on PolygonScan
- [ ] Token distribution is correct (500M + 200M + 150M + 150M = 1B)
- [ ] Trading is enabled
- [ ] Staking pools are active
- [ ] Tax configuration is correct (3% buy, 5% sell)
- [ ] Owner permissions are correct

### Network & Connectivity

- [ ] Contracts are on Polygon Mainnet (Chain ID 137)
- [ ] Contract addresses are saved and backed up
- [ ] PolygonScan links are working
- [ ] Block explorer shows correct contract details

### Liquidity & Trading

- [ ] Initial liquidity added to DEX
- [ ] AETH/WMATIC pair is created
- [ ] Pair appears on QuickSwap
- [ ] Test buy transaction works
- [ ] Test sell transaction works
- [ ] Taxes are applied correctly

### Frontend Integration

- [ ] Frontend updated with correct contract addresses
- [ ] ABI files updated from artifacts
- [ ] Wallet connection works
- [ ] Token balance displays correctly
- [ ] Staking interface functional
- [ ] Transaction history shows correctly

## Common Issues & Solutions

### Issue: Verification script fails

**Symptoms:**
- ✗ FAIL checks in verify-setup.js
- Red error messages

**Solutions:**
1. Read the error message carefully
2. Check the specific field mentioned (PRIVATE_KEY, POLYGON_RPC_URL, etc.)
3. Compare your .env with .env.example
4. Ensure no extra spaces or hidden characters
5. Verify format requirements (0x prefix, correct length)

### Issue: Deployment transaction reverts

**Symptoms:**
- "Transaction reverted" error
- Gas estimation fails

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Insufficient POL | Add more POL to deployer wallet |
| Wrong network | Verify POLYGON_RPC_URL is for Polygon Mainnet |
| Invalid parameters | Check wallet addresses are correct |
| Network congestion | Wait and retry with higher gas |

### Issue: Contract verification fails on PolygonScan

**Solutions:**
1. Verify constructor arguments are correct
2. Use exact compiler version from hardhat.config.js
3. Ensure optimization settings match (200 runs)
4. Wait 1-2 minutes after deployment before verifying
5. Try manual verification on PolygonScan website

### Issue: Trading enable fails

**Symptoms:**
- "Ownable: caller is not the owner" error
- Transaction reverts

**Solutions:**
1. Ensure you're using deployer's private key in .env
2. Verify AETH_TOKEN_ADDRESS is correct
3. Check if trading is already enabled
4. Confirm wallet has POL for gas

### Issue: Liquidity addition fails

**Symptoms:**
- "Insufficient balance" error
- Approval fails

**Solutions:**
1. Verify you have enough AETH tokens
2. Ensure you have WMATIC (wrap POL if needed)
3. Check token approvals are successful
4. Try with smaller amounts first
5. Increase slippage tolerance if needed

## Emergency Procedures

### If deployment fails mid-process:

1. **Do not panic** - funds are safe if wallet key is secure
2. Check wallet on PolygonScan for transaction history
3. If some contracts deployed, save addresses before retry
4. Review error messages and fix configuration
5. Can redeploy if needed (new addresses will be generated)

### If wrong addresses used:

1. **Cannot change after deployment** - addresses are immutable
2. Options:
   - Deploy new contracts with correct addresses
   - Transfer ownership if ownership transfer is enabled
   - Use current setup and adjust processes

### If trading enabled too early:

1. **Cannot disable** - trading is permanent once enabled
2. Action plan:
   - Proceed with liquidity addition immediately
   - Announce launch to avoid confusion
   - Monitor initial trading

## Post-Launch Checklist

### Immediate (Day 1)

- [ ] Monitor initial trading activity
- [ ] Verify liquidity pool is active
- [ ] Check that taxes are working correctly
- [ ] Test staking functionality
- [ ] Update website/documentation with contract addresses
- [ ] Announce launch on social media
- [ ] Submit to token tracking sites (DexScreener, DexTools)

### Short-term (Week 1)

- [ ] Monitor contract for any issues
- [ ] Track liquidity depth
- [ ] Review staking participation
- [ ] Apply for CoinGecko listing
- [ ] Apply for CoinMarketCap listing
- [ ] Gather user feedback
- [ ] Address any support questions

### Long-term

- [ ] Regular security audits
- [ ] Monitor smart contract events
- [ ] Track tokenomics health
- [ ] Plan future upgrades (if applicable)
- [ ] Community engagement
- [ ] Exchange listings

## Support Resources

**Documentation:**
- Main README: `../README.md`
- Smart Contract README: `./README.md`
- .env.example: Template with all variables

**Scripts:**
- `scripts/verify-setup.js` - Pre-deployment verification
- `scripts/deploy.js` or `scripts/redeploy.js` - Deployment
- `scripts/enable-trading.js` - Enable trading
- `scripts/add-liquidity.js` - Add liquidity
- `scripts/final-deployment-check.js` - Post-deployment verification

**External Resources:**
- PolygonScan: https://polygonscan.com
- QuickSwap: https://quickswap.exchange
- Polygon RPC: https://rpc.polygon.technology/
- Hardhat Docs: https://hardhat.org/getting-started/

**Getting Help:**
1. Run `node scripts/verify-setup.js` for diagnostics
2. Check error messages carefully
3. Review this guide's troubleshooting section
4. Search existing GitHub issues
5. Open new issue with verification output

## Final Notes

✅ **Success Criteria:**
- All verification checks pass
- Contracts deployed and verified
- Trading enabled
- Liquidity added
- No errors in final verification
- Community can trade tokens

⚠️ **Remember:**
- Always run verify-setup.js before deployment
- Save all contract addresses and transaction hashes
- Backup deployment logs
- Never share private keys
- Test on testnet first when possible
- Double-check all addresses before deploying

🎉 **Congratulations!**
If you've completed all steps successfully, your Aetheron Platform is now live on Polygon Mainnet!

---

**Document Version:** 2.0
**Last Updated:** 2026-01-15
**Network:** Polygon Mainnet (Chain ID: 137)