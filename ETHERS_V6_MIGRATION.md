# Ethers.js v6 Migration Guide

## Overview
This repository has been migrated from ethers.js v5 to v6. This document outlines the changes made and provides guidance for contributors working with the codebase.

## Key Changes in Ethers.js v6

### 1. Provider Initialization
**v5 (old):**
```javascript
const provider = new ethers.providers.JsonRpcProvider(url);
const provider = new ethers.providers.Web3Provider(window.ethereum);
```

**v6 (new):**
```javascript
const provider = new ethers.JsonRpcProvider(url);
const provider = new ethers.BrowserProvider(window.ethereum);
```

### 2. Signer Access
**v5 (old):**
```javascript
const signer = provider.getSigner();
```

**v6 (new):**
```javascript
const signer = await provider.getSigner(); // Now async!
```

### 3. Utility Functions
**v5 (old):**
```javascript
ethers.utils.parseEther("1.0")
ethers.utils.formatEther(value)
ethers.utils.parseUnits("100", 6)
ethers.utils.formatUnits(value, 6)
```

**v6 (new):**
```javascript
ethers.parseEther("1.0")
ethers.formatEther(value)
ethers.parseUnits("100", 6)
ethers.formatUnits(value, 6)
```

### 4. Constants
**v5 (old):**
```javascript
ethers.constants.MaxUint256
```

**v6 (new):**
```javascript
ethers.MaxUint256
```

### 5. Contract Deployment
**v5 (old):**
```javascript
const contract = await Contract.deploy(...args);
await contract.deployed();
const address = contract.address;
```

**v6 (new):**
```javascript
const contract = await Contract.deploy(...args);
await contract.waitForDeployment();
const address = await contract.getAddress();
```

### 6. BigNumber Methods → BigInt Comparisons
**v5 (old):**
```javascript
if (allowance.lt(amount)) { ... }
if (balance.gt(threshold)) { ... }
const result = value.mul(95).div(100);
```

**v6 (new):**
```javascript
if (allowance < amount) { ... }
if (balance > threshold) { ... }
const result = (value * 95n) / 100n; // Use BigInt literals (n suffix)
```

### 7. Transaction History
**v5 (old):**
```javascript
const txs = await provider.getHistory(address, startBlock, endBlock);
```

**v6 (new):**
```javascript
// getHistory is removed - use block-based queries instead
const block = await provider.getBlock(blockNumber, false);
for (const txHash of block.transactions) {
    const tx = await provider.getTransaction(txHash);
    // process transaction
}
```

## Files Modified

### Core Application Files
- `add-liquidity.js` - QuickSwap liquidity interface
- `dashboard.html` - Main dashboard UI
- `aetheron-advanced.html` - Advanced features UI
- `aetheron-integration.js` - Token integration utilities
- `Scripts/deploy.js` - Deployment script

### Backend Services
- `backend/push-notify-wallets.js` - Wallet notification monitor

### Mobile Application
- `mobile-app/src/screens/StakingScreen.tsx` - Staking interface

### Smart Contract Scripts
- `smart-contract/add-liquidity.js` - DEX liquidity script
- `smart-contract/fund-wallets.js` - Token distribution script
- `smart-contract/interact-mainnet.js` - Contract interaction script

## Dependency Management

### Package Structure
Dependencies are now properly separated by component:

#### Root (`package.json`)
- Minimal dependencies: `ethers ^6.10.0`, `dotenv ^16.3.1`
- Used for HTML files and root-level scripts

#### Backend (`backend/package.json`)
- `ethers ^6.10.0` - Web3 functionality
- `axios ^1.6.5` - HTTP requests
- `dotenv ^16.3.1` - Environment configuration

#### Smart Contracts (`smart-contract/package.json`)
- Development dependencies for Hardhat toolchain
- `ethers ^6.10.0` in devDependencies
- `@openzeppelin/contracts ^5.0.0`
- `dotenv ^16.3.1`

#### Mobile App (`mobile-app/package.json`)
- `ethers ^6.0.0` - Web3 functionality
- `react-native-onesignal ^5.2.16` - Push notifications
- React Native dependencies

## Known Issues and Workarounds

### Solidity Compiler Download (binaries.soliditylang.org)

**Issue:** CI/CD pipelines may encounter firewall blocks when Hardhat tries to download Solidity compiler binaries from `binaries.soliditylang.org`.

**Error Message:**
```
Error: Failed to download Solidity compiler
Could not connect to binaries.soliditylang.org
```

**Workarounds:**

#### Option 1: GitHub Actions Pre-setup Steps
Add to your workflow before the firewall is enabled:
```yaml
- name: Pre-install Solidity Compiler
  run: |
    cd smart-contract
    npm install
    npx hardhat compile
```

#### Option 2: Allowlist Configuration
For repository admins:
1. Go to Repository Settings → Copilot → Coding Agent Settings
2. Add `binaries.soliditylang.org` to the custom allowlist

#### Option 3: Local Compiler Cache
Commit the downloaded compiler binaries (not recommended for production):
```bash
cd smart-contract
npx hardhat compile
# Commit the cache directory
git add -f .cache
git commit -m "Add Solidity compiler cache"
```

#### Option 4: Use Specific Solidity Version
In `hardhat.config.js`, specify an exact version:
```javascript
module.exports = {
  solidity: {
    version: "0.8.24", // Exact version
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  }
};
```

## Testing Your Changes

### After Making Code Changes:

1. **Install dependencies:**
```bash
# Root
npm install

# Backend
cd backend && npm install && cd ..

# Smart contracts
cd smart-contract && npm install && cd ..

# Mobile app
cd mobile-app && npm install && cd ..
```

2. **Compile smart contracts:**
```bash
cd smart-contract
npm run compile
```

3. **Run tests:**
```bash
cd smart-contract
npm test
```

4. **Test backend scripts:**
```bash
cd backend
node push-notify-wallets.js
```

## CDN Updates for HTML Files

HTML files now use ethers.js v6 CDN:
```html
<!-- Old (v5) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>

<!-- New (v6) -->
<script src="https://cdn.ethers.io/lib/ethers-6.10.umd.min.js"></script>
```

## Breaking Changes to Watch For

1. **Async getSigner()** - Always await when getting signer
2. **BigInt instead of BigNumber** - Use native BigInt operators
3. **Contract address** - Use `await contract.getAddress()` not `.address`
4. **Transaction history** - Must use block-based queries
5. **Network chainId** - Returns Number, not BigNumber

## Migration Checklist for New Code

When adding new code that uses ethers.js:

- [ ] Use `ethers.JsonRpcProvider` or `ethers.BrowserProvider`
- [ ] Await `provider.getSigner()`
- [ ] Use `ethers.parseEther()` not `ethers.utils.parseEther()`
- [ ] Use `ethers.formatEther()` not `ethers.utils.formatEther()`
- [ ] Use `ethers.MaxUint256` not `ethers.constants.MaxUint256`
- [ ] Use BigInt comparisons (`<`, `>`) not BigNumber methods (`.lt()`, `.gt()`)
- [ ] Use `await contract.waitForDeployment()` not `await contract.deployed()`
- [ ] Use `await contract.getAddress()` not `contract.address`
- [ ] For math: use BigInt literals with `n` suffix (e.g., `95n`)

## References

- [Ethers.js v6 Migration Guide](https://docs.ethers.org/v6/migrating/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Breaking Changes](https://docs.ethers.org/v6/migrating/#migrating-from-ethers-v5)

## Support

If you encounter issues with the migration:
1. Check this guide first
2. Review the official ethers.js v6 migration guide
3. Look at committed examples in this repository
4. Open an issue with the `ethers-migration` label
