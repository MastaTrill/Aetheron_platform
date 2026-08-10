# Base Sepolia Operator Runbook — AETH Presale + Staking Rehearsal

**Purpose:** Step-by-step guide to execute the protected rehearsal required by #217 before any #219 authorization.

**Network:** Base Sepolia (chain ID `84532`)  
**Do not** use mainnet keys or mainnet RPC for this runbook.

---

## 0. Preconditions

- [ ] Funded Base Sepolia wallet (test ETH only)
- [ ] Private key / deployer available **locally only** (never commit)
- [ ] `BASE_SEPOLIA_RPC_URL` set in env (public or private RPC)
- [ ] Repo cloned, dependencies installed
- [ ] Evidence templates ready:
  - `docs/evidence/BASE_SEPOLIA_REHEARSAL_TEMPLATE.md`
  - `docs/evidence/base-sepolia-rehearsal.template.json`

```bash
cd smart-contract
npm ci   # or forge install / foundry workflow as used in this repo
npm test # or forge test — must pass before deploy
```

---

## 1. Deploy stack on Base Sepolia

Use the repository’s protected / dry-run deployment scripts if present. Typical pattern:

```bash
# Example — adapt to actual scripts in smart-contract/
npx hardhat run scripts/deploy.js --network baseSepolia
# or
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify
```

Record for **every** contract:
- address
- deploy tx hash
- block number
- bytecode hash
- BaseScan Sepolia verification URL

---

## 2. Exercise required paths

Run (via scripts or manual txs) and capture tx hashes for each:

1. Presale **success** path  
2. Presale **cancel** path  
3. **Refund** path  
4. **Claim** path  
5. **Treasury withdrawal** path  
6. Staking **deposit**  
7. Staking **withdraw / emergency exit**  
8. Owner / role boundary checks

---

## 3. Separation review

Document:

| Role | Address | Controlled by |
|------|---------|---------------|
| Owner | | |
| Treasury | | |
| Multisig | | |
| Timelock | | |

Confirm no single EOA inappropriately holds all critical roles if the design requires separation.

---

## 4. Package evidence

1. Fill `BASE_SEPOLIA_REHEARSAL_TEMPLATE.md`  
2. Fill `base-sepolia-rehearsal.template.json`  
3. Compute manifest digest (SHA-256 of the final JSON)  
4. Commit evidence under `docs/evidence/` or `smart-contract/deployments/` as appropriate  
5. Comment on issue **#217** with links to the filled packet  
6. Only then request advancement of **#219**

---

## 5. Hard rules

- Sepolia success does **not** authorize mainnet trading or presale.
- Do not copy Sepolia addresses into production frontend config.
- Do not enable trading until `docs/TRADING_AND_LIQUIDITY_PLAN.md` preconditions are met and #219 is closed.

---

## Related

- Issue #217 (rehearsal blocker)
- Issue #219 (final authorization)
- `docs/TRADING_AND_LIQUIDITY_PLAN.md`
- `PROJECT_STATUS.md`
