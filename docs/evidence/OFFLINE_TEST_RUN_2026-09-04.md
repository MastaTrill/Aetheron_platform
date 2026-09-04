# Offline smart-contract test run — 2026-09-04

Executed in a disposable sandbox (no production keys; no mainnet/testnet broadcast).

## Commands

```bash
cd smart-contract
npm install
npx hardhat compile
npm run test:aeth-v2
npm test
npm run rehearsal:base-sepolia:presale   # expected fail-closed without env
```

## Results

| Step | Result |
|------|--------|
| Compile (solc 0.8.20) | 16 Solidity files compiled |
| `npm run test:aeth-v2` | **14/14 pass** |
| `npm test` | **74/74 pass** |
| Sepolia rehearsal script | **Fail-closed**: `BASE_SEPOLIA_RPC_URL is required` |

## AETH V2 highlights (all pass)

- 1B supply + 50/20/15/15 allocation
- Fixed 3% buy / 5% sell tax
- Owner AMM trades taxed after launch
- Wallet-to-wallet tax-free
- One-way trading enable
- Ownable2Step
- Manifest remains `prepared_not_deployed` / address null

## Explicit non-results

- No Base Sepolia deployment
- No Base Mainnet deployment
- No trading enable
- No liquidity
- No public funds accepted
- Issue **#217** remains open until operator fills `BASE_SEPOLIA_REHEARSAL_TEMPLATE.md` with real tx evidence

## Operator still required for #217

```bash
export BASE_SEPOLIA_RPC_URL=...
export PRIVATE_KEY=...   # offline only; never commit
export CONFIRM_LIVE_ACTION=DEPLOY_BASE_SEPOLIA_REHEARSAL  # exact gate string per script
# then: npm run rehearsal:base-sepolia:presale
```

After success, commit only the generated `deployments/base-sepolia-presale-rehearsal.json` + filled template — never keys.
