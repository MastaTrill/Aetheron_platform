# Release truth and acceptance gate — 2026-10-14

This is an audit snapshot, not authorization for on-chain transactions.

## Authority
- AETH, presale, staking, frontend, and treasury: this repository.
- Sentinel security and replacement release: `MastaTrill/Aetheron-Sentinel-L3`.
- `MastaTrill/Aetheron` is a legacy prototype; do not use it for public purchases.

## Verified repository claims, not fresh RPC verification
- Canonical Base AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` (chain 8453).
- Existing presale `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` ended 2026-08-01; `purchaseAuthorized` remains false.
- The 2026-09-03 audit reported on-chain `tradingEnabled=true`, while canonical liquidity remains unconfigured; historical manifest descriptions of 'disabled' must not override fresh RPC truth.
- AETH recovery owner-signing instructions are prepared; execution and resulting receipts have not been established.

## Release gates (all must be evidenced)
- [ ] Confirm main HEAD, CI checks and dependency test results.
- [ ] Resolve blocked Vercel deployment statuses and verify live HTTP behavior.
- [ ] Verify current Base RPC state, owner, code, presale status, refund path, trading flag, pool addresses and transaction receipts.
- [ ] Reconcile `README.md`, `smart-contract/deployments/aeth-base.json`, `presale-base.json`, `docs/AETHERON_CONTRACT_REGISTRY.json` with observed evidence.
- [ ] Run contract tests, backend/frontend builds and wallet-connected acceptance tests.
- [ ] Record recovery transaction and authorization evidence if recovery is independently approved and executed.
- [ ] Do not enable purchases, add liquidity, move funds or change production addresses without separate approval and verified receipts.

## Current CI finding
The inspected HEAD reported failing Vercel statuses for `vercel-node-app-1` and `aetheron`, with links indicating account deployment blocked. This is not proof of an application build failure. Diagnose provider/account access before changing application code.
