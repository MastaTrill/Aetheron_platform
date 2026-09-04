# Aetheron Platform — Canonical Project Status

**Status:** Active flagship  
**Last updated:** 2026-09-02  
**Canonical role:** Commercial Aetheron product: AETH token, presale, staking, public frontend, wallet onboarding, and treasury-facing operations.

## Production truth

- Canonical production network: **Base Mainnet** (chain ID `8453`).
- Canonical AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- AETH creation transaction: `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829`.
- AETH source verification is recorded in `smart-contract/deployments/aeth-base.json`.
- Corrected Base presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- Presale deployment transaction: `0x7ac118e87c317b8c8cad669fac7fd04788529181fac8b577ee182d01a4270326`.
- The corrected presale is deployed, funded, source-verified, and has a recorded owner smoke purchase in `smart-contract/deployments/presale-base.json`.
- **Deployment is not launch authorization.** Current frontend configuration sets `launchAuthorized: false` and `status: "pending_final_authorization"`; public purchases remain blocked pending issue #219.
- The canonical Base V1 token is observed on-chain with `tradingEnabled: true`, while the release model explicitly keeps `publicMarketAuthorized: false` and `publicPurchasesAuthorized: false`. The on-chain flag does not constitute production launch approval.
- The older Base presale `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` is invalid/legacy and must not be used for public purchases.
- Polygon Mumbai, Polygon mainnet, Solana, and any earlier AETH addresses are **legacy deployments** unless separately revalidated and entered into the canonical registry.

## Cross-project Sentinel deployment truth

Sentinel L3 is maintained in `MastaTrill/Aetheron-Sentinel-L3`, not in the Platform smart-contract tree.

- A live SENTINEL token exists on Base Mainnet at `0x8c1eb8db47d52a8b5e2b1eb4e5ec9491ce030ba3`.
- Its on-chain metadata is `SENTINEL` / `SENTINEL`, 18 decimals, with a recorded 100 billion token supply.
- The current Sentinel controlled-redeployment record classifies this address as **legacy/non-canonical** while a replacement Base Mainnet deployment remains pending.
- The Platform portfolio registry records this deployed legacy token for inventory accuracy; it does not promote it to current Sentinel production release status.

Canonical portfolio registry: `docs/AETHERON_CONTRACT_REGISTRY.json`.

## In scope

- AETH token integration and verified contract registry
- Presale success, cancellation, refund, claim, and treasury-withdrawal paths
- Staking and emergency exits
- Public website and wallet experience
- Treasury, multisig, timelock, and operational controls
- Base Sepolia rehearsal and immutable launch evidence

## Out of scope

- Sentinel L3 security-suite development (see `MastaTrill/Aetheron-Sentinel-L3`)
- Experimental quantum, ZK, AI-security, bridge, or oracle contracts
- General-purpose AI agents
- Mobile or multichain experiments not required by the public platform

## Current launch gates

- [ ] Complete and commit the protected Base Sepolia presale + staking rehearsal evidence (issue #217)
- [ ] Preserve contract addresses, transaction hashes, block numbers, bytecode hashes, verification URLs, and manifest digest
- [ ] Review owner, treasury, multisig, and timelock separation
- [ ] Complete an independent smart-contract review
- [ ] Authorize any Base Mainnet presale action separately (issue #219) — testnet rehearsal does **not** authorize mainnet
- [x] Decide and document the trading-enablement and liquidity plan — **draft published** at `docs/TRADING_AND_LIQUIDITY_PLAN.md` (execution still blocked until #219)
- [ ] Finish retirement of any remaining active Polygon-first execution/configuration surfaces tracked by #214

**Evidence templates:**
- `docs/evidence/BASE_SEPOLIA_REHEARSAL_TEMPLATE.md`
- `docs/evidence/base-sepolia-rehearsal.template.json`

**Status snapshot:** `docs/STATUS_2026-08-11.md`

**Trading plan:**
- `docs/TRADING_AND_LIQUIDITY_PLAN.md` (draft only; not authorized for execution)

## Repository rules

1. Production contract records belong in `smart-contract/deployments/`.
2. Frontend configuration must consume canonical deployment records rather than manually duplicated addresses.
3. Every address must be labeled by network and status: `production`, `deployed-disabled`, `testnet`, `legacy`, `simulation`, or `deprecated`.
4. A contract may be objectively deployed while its public use remains disabled; documentation must keep deployment state and launch authorization separate.
5. Files must not claim “mainnet complete” unless transaction hashes, deployed bytecode, ownership, explorer verification, and applicable release authorization are retained.
6. Sentinel security contracts belong in `MastaTrill/Aetheron-Sentinel-L3`.

## Next cleanup pass

- Keep root README Base-first.
- Move remaining historical Polygon instructions into `docs/legacy/` where useful.
- Remove generated build output and duplicate deployment records from version control where safe.
- Maintain one machine-readable portfolio contract registry.
- Keep historical deployment journals immutable where possible; supersede their old launch claims through current release-status files rather than rewriting receipts.
