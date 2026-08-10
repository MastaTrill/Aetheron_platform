# Base Sepolia Platform Rehearsal Runbook

**Issue:** #217  
**Goal:** Protected presale + staking rehearsal on Base Sepolia with immutable evidence  
**Does NOT authorize mainnet.** Closing this gate only unlocks the path to #219.

---

## Pre-flight checklist

- [ ] Node.js installed; you can run `npm` in `smart-contract/`
- [ ] Wallet with **Base Sepolia ETH** (script default minimum: **0.01 ETH**)
- [ ] Base Sepolia RPC URL (Alchemy / Infura / public)
- [ ] Etherscan/BaseScan API key for source verification
- [ ] Private key available **only** in local `.env` (never commit it)
- [ ] Working directory: repo root, then `cd smart-contract`

Get testnet ETH if needed: [https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet) or other Base Sepolia faucets.

---

## 1. Environment

```bash
cd smart-contract
cp .env.example .env   # if you do not already have .env
```

Edit `.env` and set at least:

```env
PRIVATE_KEY=0xYOUR_64_CHAR_HEX_KEY
BASE_SEPOLIA_RPC_URL=https://your-base-sepolia-rpc
ETHERSCAN_API_KEY=your_etherscan_or_basescan_key
```

Optional overrides:

```env
REHEARSAL_TREASURY_ADDRESS=0x...          # defaults to deployer
REHEARSAL_PURCHASE_ETH=0.0001
REHEARSAL_RATE=1000000
REHEARSAL_START_DELAY_SECONDS=20
REHEARSAL_DURATION_SECONDS=3600
MIN_REHEARSAL_BALANCE_ETH=0.01
ALLOW_REHEARSAL_OVERWRITE=true            # only if re-running over an existing manifest
```

---

## 2. Install + compile

```bash
npm ci
npm run compile
npm test
```

Fix any failures before continuing.

---

## 3. Dry-run readiness (no chain writes)

```bash
DRY_RUN=true npm run rehearsal:base-sepolia:presale
```

Expected: JSON with `rehearsalReadiness` and message `BASE SEPOLIA PRESALE REHEARSAL READINESS: PASS`.

If it fails on balance, chain ID, or missing key, fix env and retry.

---

## 4. Live rehearsal (writes to Base Sepolia)

```bash
CONFIRM_BASE_SEPOLIA_REHEARSAL=DEPLOY_BASE_SEPOLIA_REHEARSAL \
  npm run rehearsal:base-sepolia:presale
```

What the script does automatically:

1. Deploys **MockAETH**
2. Deploys **SuccessPresale** and **RefundPresale** (AetheronPresaleV2)
3. Deploys **AetheronStaking**
4. Funds both presales with tokens
5. Deposits staking rewards
6. Waits for sale start
7. Asserts non-owner cancel / pool update are rejected
8. **Success path:** buy → finalize → claim → withdrawFunds
9. **Refund path:** buy → cancel → claimRefund
10. **Staking path:** stake → early unstake rejected → emergencyUnstake
11. Writes manifest to:
    `smart-contract/deployments/base-sepolia-presale-rehearsal.json`
12. Prints `manifestSha256`

**Copy the printed addresses and `manifestSha256` immediately.**

---

## 5. Source verification on BaseScan Sepolia

```bash
npm run verify:base-sepolia:rehearsal
```

Requires `ETHERSCAN_API_KEY` or `BASESCAN_API_KEY`.

On success, status becomes `verified-rehearsal` and each contract gets a BaseScan URL under `verification.url`.

---

## 6. Fill the evidence packet

Use the templates already in the repo:

- `docs/evidence/BASE_SEPOLIA_REHEARSAL_TEMPLATE.md`
- `docs/evidence/base-sepolia-rehearsal.template.json`

From the manifest, extract:

| Field | Source |
|-------|--------|
| Addresses | `manifest.contracts.*.address` |
| Deploy txs / blocks | `manifest.contracts.*.deployment` |
| Runtime bytecode hashes | `manifest.contracts.*.runtimeCodeHash` |
| Path txs | `manifest.transactions.*` |
| Assertions | `manifest.assertions` |
| Manifest digest | printed `manifestSha256` |
| Verification URLs | `manifest.contracts.*.verification.url` |

Also record owner / treasury / multisig / timelock notes (treasury used in rehearsal is in `manifest.treasury`).

---

## 7. Close the gate on GitHub

1. Commit the filled evidence (or attach the completed JSON + markdown) — **do not commit `.env` or private keys**.
2. Comment on **#217** with:
   - Manifest path + SHA-256
   - Contract addresses
   - Confirmation that success / refund / staking / privilege paths all passed
   - Link to verification URLs
3. When evidence is complete, mark #217 closed (completed) and request review on **#219**.

---

## Failure / re-run notes

- Manifest already exists → set `ALLOW_REHEARSAL_OVERWRITE=true` only if intentional.
- Insufficient ETH → top up Base Sepolia balance and retry dry-run.
- Wrong chain → script hard-requires chain ID `84532`.
- Missing artifacts → `npm run compile` first.
- Verification fails → ensure build-info exists and API key is valid; re-run verify only (do not redeploy unless necessary).

---

## Explicit non-claims

- This rehearsal does **not** authorize Base Mainnet presale, trading, or liquidity.
- Canonical production AETH remains on Base Mainnet with trading disabled until #219.
