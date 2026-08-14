# 🚀 Aetheron Platform — Launch Operator Runbook

This runbook provides the exact step-by-step commands and verification checklist for deploying, configuring, and funding the Aetheron ecosystem across Base and Polygon mainnets.

---

## 📋 Prerequisites & Wallet Requirements

| Network | Target Operation | Required Gas / Funds | Authorized Wallet |
| :--- | :--- | :--- | :--- |
| **Base Mainnet** (`8453`) | Replacement Presale Deploy & Fund | ~0.001 ETH ($3) + 25M AETH | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| **Polygon Mainnet** (`137`) | DEX Router & Pool Binding | ~0.05 POL ($0.02) | `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452` |
| **Polygon Mainnet** (`137`) | Governance Contract Deploy | ~0.05 POL ($0.02) | Deployer Wallet with POL |
| **Polygon Mainnet** (`137`) | Staking Reward Deposit | ~0.05 POL + 100K AETH | Token holder with AETH & POL |

---

## ⚡ Execution Phase 1: Base Mainnet Presale Deployment

### 1.1 Dry-Run Preflight Simulation
```bash
node smart-contract/scripts/deploy-base-presale-safe.mjs --dry-run
```
*Expected: Prints verified parameters binding to Base AETH (`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`) and treasury (`0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa`).*

### 1.2 Live Broadcast
```bash
CONFIRM_BASE_MAINNET_DEPLOY=DEPLOY_CORRECTED_PRESALE \
PRIVATE_KEY=<BASE_OWNER_PRIVATE_KEY> \
node smart-contract/scripts/deploy-base-presale-safe.mjs
```

---

## ⚡ Execution Phase 2: Polygon DEX Router & Single-Pass Tax Binding

### 2.1 Dry-Run Preflight Simulation
```bash
node smart-contract/scripts/configure-dex-router.mjs --dry-run
```
*Expected: Confirms target QuickSwap Router (`0xa5E0...`) and Pool (`0xd57c...`).*

### 2.2 Live Broadcast
```bash
PRIVATE_KEY=<POLYGON_OWNER_PRIVATE_KEY> \
node smart-contract/scripts/configure-dex-router.mjs --confirm
```

---

## ⚡ Execution Phase 3: Polygon Governance Contract Deployment

### 3.1 Dry-Run Preflight Simulation
```bash
node smart-contract/scripts/deploy-governance.mjs --dry-run
```

### 3.2 Live Broadcast
```bash
PRIVATE_KEY=<DEPLOYER_PRIVATE_KEY> \
node smart-contract/scripts/deploy-governance.mjs --confirm
```

---

## ⚡ Execution Phase 4: Staking Reward Pool Funding

### 4.1 Dry-Run Preflight Simulation
```bash
node smart-contract/scripts/deposit-staking-rewards.mjs --dry-run --amount 100000
```

### 4.2 Live Broadcast
```bash
PRIVATE_KEY=<AETH_HOLDER_PRIVATE_KEY> \
node smart-contract/scripts/deposit-staking-rewards.mjs --amount 100000 --confirm
```

---

## 🧪 Verification & Health Checks

Run all automated unit tests and smoke tests:
```bash
# Run Smart Contract unit test suite
cd smart-contract
npm test

# Run Frontend build and UI smoke tests
cd ..
npm run build
npm run test:smoke
```

---

## 🌐 Post-Launch Checklist
1. Update `governance.html` and `voting-history.html` with the newly deployed Polygon governance address.
2. Submit token verification updates on BaseScan and PolygonScan.
3. Submit listing updates on CoinMarketCap and CoinGecko using [`COINMARKETCAP_APPLICATION.md`](COINMARKETCAP_APPLICATION.md) and [`COINGECKO_APPLICATION.md`](COINGECKO_APPLICATION.md).
