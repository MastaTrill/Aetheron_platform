# Issue #217 path-evidence substitution — 2026-09-04

## Decision

**Close #217** without a separate Base Sepolia `verified-rehearsal` manifest.

**Rationale:** Canonical AETH and the corrected Base presale already exist on **Base Mainnet** with recorded deployment, verification, funding, and owner smoke-purchase receipts. The original Sepolia gate assumed *testnet first, mainnet second*. Reality inverted that order. Requiring Sepolia after mainnet contracts are live adds process cost without changing the fact that path behavior is already proven by:

1. Mainnet deployment + owner smoke receipts, and  
2. The full offline contract suite (74/74 pass as of 2026-09-04).

**This does not authorize public launch.** Issue **#219** remains the sole gate for public purchases, trading, and liquidity. Frontend must keep `launchAuthorized: false` until #219 is explicitly approved.

## Path coverage map

| Required path (#217) | Evidence used | Location |
|----------------------|---------------|----------|
| Deploy + fund presale | Mainnet deploy, fund, excludeFromTax txs | `smart-contract/deployments/presale-base.json` |
| Purchase (success) | Owner smoke purchase `0.0003 ETH` | `presale-base.json` → `transactions.smokePurchase` / `smokePurchase` |
| Token linkage | `verifiedState.token` matches AETH | `presale-base.json`, `aeth-base.json` |
| Source verification | BaseScan verified | both deployment JSONs |
| Cancel / refund / claim / escrow accounting | Exact production simulation suite | `npm test` → ProductionPresaleSimulation (74 tests green, see `docs/evidence/OFFLINE_TEST_RUN_2026-09-04.md`) |
| Privilege / unauthorized paths | Unit + simulation tests | same suite |
| Sepolia-only end-to-end broadcast | **Not performed** — deliberately substituted | this document |

## Mainnet receipts (canonical)

| Item | Value |
|------|--------|
| Network | Base Mainnet `8453` |
| AETH | `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| AETH create tx | `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829` |
| Presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` |
| Presale deploy tx | `0x7ac118e87c317b8c8cad669fac7fd04788529181fac8b577ee182d01a4270326` |
| Smoke purchase tx | `0xd16ffbfe89c9a72d9fec77bf72642092f1e2593868bb01ad872dc83bf2fa5728` |
| Owner / treasury (recorded) | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| Invalid legacy presale (do not use) | `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` |
| Trading (token record) | `tradingEnabled: false` |

## Known residual risks for #219 (not closed here)

1. **Owner == treasury** in recorded wallets — privilege separation still needs explicit acceptance or remultisig before public funds.
2. **Staking / emergency exit** may need a dedicated mainnet or testnet smoke if staking is in the public launch surface; confirm before enabling.
3. **Independent contract review** is still listed on #219 and is not satisfied by this substitution.
4. **Historical `presale-base.json` fields** (`launchable: true`, frontend `live`) conflict with product gate `launchAuthorized: false`. Product gate wins until #219 says `approved`.

## Policy statement

> As of 2026-09-04, Aetheron Platform treats Base Mainnet deployment evidence plus the green offline production simulation suite as sufficient to **close the Sepolia rehearsal blocker (#217)**. Public acceptance of funds, trading enablement, and liquidity remain **blocked** until issue **#219** records written authorization for the exact commit SHA and addresses.

Operator: repository policy update on behalf of owner direction (“Do what you recommend”).  
Sepolia scripts and templates remain available if a future operator still wants a testnet dress rehearsal; they are no longer required to close #217.
