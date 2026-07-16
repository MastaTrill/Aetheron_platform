# Aetheron Platform - Post-Audit Deployment Status
**Audit Date:** 2026-07-02
**Status:** Hardened in code — final Web3 actions require manual signing by contract owner

---

## Verified On-Chain State (Polygon Mainnet)

| Item | Value |
|---|---|
| AETH Token | `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e` |
| AetheronStaking | `0x896D9d37A67B0bBf81dde0005975DA7850FFa638` |
| Liquidity Pair | `0xd57c5E33ebDC1b565F99d06809debbf86142705D` |
| Contract Owner | `0xDF5A2b892254C42F80000A029dfE8b311f777Bd5` |
| Team Wallet | `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784` |
| Marketing Wallet | `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452` |
| Treasury (c1fa) | `0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa` |
| Trading Enabled | `true` |
| Buying Tax | 3% |
| Selling Tax | 5% |
| Quickswap Router | **(not set on-chain — must configure before trades work correctly)** |

---

## Audit Results

### Wallets Survived Audit

All `.env` and repo wallet references now consistent with live on-chain state.

- PRIVATE_KEY was removed from `smart-contract/.env` to prevent committing an invalid/obsolete key to git history.
- Use the private key belonging to `0xDF5A2b892254C42F80000A029dfE8b311f777Bd5` in local `.env` when running deployment scripts.

### Backdoor Scan — Clear

- No hidden mint functions post-constructor
- No unrestricted owner-drain of user stakes (staking contract uses `safeTransfer` only)
- Presale is pure pull-pattern: contributors claim their own tokens and their own refunds
- Owner cannot withdraw contributor funds before softcap is met and sale finalizes
- Reentrancy guards on all state-changing user-facing functions
- Tax/caps are locked after first presale contribution

### One Known Security Note

`AetheronStaking.emergencyUnstake()` bypasses lock periods and forfeits all rewards. This is intentional for safety but makes the staking pools vulnerable to a mass-exit event if triggered by the owner or users. Treat as an emergency valve only.

---

## Remaining Web3 Actions (Must Be Signed by Contract Owner)

### 1. Fund Owner Wallet with POL

`0xDF5A2b892254C42F80000A029dfE8b311f777Bd5` currently has **0 POL**.

Send at least **0.1 MATIC** to this address so it can pay gas for all remaining transactions.

### 2. Configure DEX Router and Liquidity Pool

Call these on the AETH token contract (`0xAb5...671e`) from `0x8A3a...3452`:

```
setQuickSwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564)
setLiquidityPool(0xd57c5E33ebDC1b565F99d06809debbf86142705D)
setExcludedFromTax(0xd57c5E33ebDC1b565F99d06809debbf86142705D, true)
```

Without these, the contract cannot detect DEX buy/sell paths. Every trade will be taxed twice — destroying tokenomics.

### 3. Verify Correct Tax Detection After Router Set

After setting the router/pool, verify one swap on QuickSwap actually hits the `isSell = true` path and taxes only once (sell tax 5%, not 3% + 5%).

### 4. Mainnet Presale (Not Yet Deployed)

Deploy presale to mainnet only after steps 1–3 are confirmed:

```
cd smart-contract
npm run deploy:presale
```

Current configured rate: 1000 AETH per MATIC | soft cap 5000 MATIC | hard cap 33333 MATIC

---

## Security Recommendations

1. **Cold storage for team tokens** — 254.7M AETH on `0x76A8...6784` should be moved to a multisig or hardware wallet.
2. **Never share the deployer private key** — the old key in `.env` was invalidated; regenerate and store offline.
3. **Consider renouncing Ownable** on Aetheron token if centralization risk is unacceptable (use `transferOwnership` to a Gnosis Safe first).
4. **Deposit staking rewards** — `rewardBalance` on `AetheronStaking` is 0. Fund with AETH before opening staking to users.
5. **Monitor router config** — if the liquidity pair address ever changes, both `setLiquidityPool` and `setExcludedFromTax` must be updated atomically.

---

## Files Modified During This Audit

| File | Change |
|---|---|
| `smart-contract/.env` | Aligned wallets to on-chain values; removed stale PRIVATE_KEY |
| `mainnet-deployment.json` | Replaced with verified on-chain snapshot |
| `smart-contract/scripts/verify-contracts.mjs` | Constructor args updated to real team/marketing/staking wallets |
| `smart-contract/scripts/deploy-mainnet.mjs` | Treasury now reads from `TREASURY_WALLET` env var |
| `smart-contract/deployments/presale-amoy.json` | Treasury corrected to c1fa wallet |
| `index.js` | OWNER_ADDRESS updated to on-chain owner |
| `index.md` | Owner reference updated |
| `README.md` | Keeper's Lantern / owner reference updated |
| `CONTRACT_ADDRESSES.md` | Full wallet audit table added |
| `verify-ownership.js` | Stale staking + owner addresses corrected |
| `transfer-ownership.js` | Stale staking + owner addresses corrected |
| `TOKEN_LAUNCH_CHECKLIST.md` | Ownership step updated to verification |
| `OWNERSHIP_TRANSFER_GUIDE.md` | Stamped as archive; transfer already done |
| `dex-submission-payload.json` | Distribution note + owner/team/treasury fields added |
| `DEPLOYMENT_GUIDE.md` | Stale staking address corrected |

---

## Option B: Fresh Aetheron Token Redeployment

A prepared redeployment script exists at `smart-contract/scripts/redeploy-aetheron.mjs`.  
It deploys a **brand new** AETH token with `NEW_OWNER_ADDRESS` as `msg.sender`/owner, plus a fresh `AetheronStaking` contract linked to the new token.

**This does not touch the existing legacy token** (`0xAb5...671e`).  
If you execute it, you will have two AETH token contracts on Polygon.  
Do NOT reuse liquidity/pools/frontend configs from the legacy deployment.

To execute (dev/testing only, not yet recommended for mainnet):

```bash
cd smart-contract
# Ensure PRIVATE_KEY in .env belongs to NEW_OWNER_ADDRESS (0xDF5A...)
# Ensure that wallet has >= 0.1 POL
node scripts/redeploy-aetheron.mjs
```

The script saves output to `redeployment.json` and prints the new contract addresses.

**Why fresh redeployment instead of ownership transfer:**
- Current on-chain owner (`0x8A3a...3452`) has **0 POL** and cannot sign any transaction.
- `transferOwnership()` from that dead wallet is impossible without external funding that you don't control.
- Fresh deployment lets the new owner (`0xDF5A...7Bd5`) be `msg.sender` immediately.
