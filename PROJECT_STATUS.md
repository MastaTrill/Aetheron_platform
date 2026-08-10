# Aetheron Platform — Canonical Project Status

**Status:** Active flagship  
**Last updated:** 2026-08-09  
**Canonical role:** Commercial Aetheron product: AETH token, presale, staking, public frontend, wallet onboarding, and treasury-facing operations.

## Production truth

- Canonical production network: **Base Mainnet** (chain ID `8453`).
- Canonical AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Creation transaction: `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829`.
- Contract source verification is recorded in `smart-contract/deployments/aeth-base.json`.
- Token trading is currently recorded as **disabled**.
- Polygon Mumbai, Polygon mainnet, Solana, and any earlier AETH addresses are **legacy deployments** unless separately revalidated and entered into the canonical registry.

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

- [ ] Complete the protected Base Sepolia presale + staking rehearsal (issue #217)
- [ ] Preserve contract addresses, transaction hashes, block numbers, bytecode hashes, verification URLs, and manifest digest
- [ ] Review owner, treasury, multisig, and timelock separation
- [ ] Complete an independent smart-contract review
- [ ] Authorize any Base mainnet presale action separately (issue #219) — testnet rehearsal does **not** authorize mainnet
- [x] Decide and document the trading-enablement and liquidity plan — **draft published** at `docs/TRADING_AND_LIQUIDITY_PLAN.md` (execution still blocked until #219)
- [ ] Remove remaining stale Polygon-first instructions where still present

**Evidence templates (fill after rehearsal):**
- `docs/evidence/BASE_SEPOLIA_REHEARSAL_TEMPLATE.md`
- `docs/evidence/base-sepolia-rehearsal.template.json`

**Trading plan:**
- `docs/TRADING_AND_LIQUIDITY_PLAN.md` (draft only; not authorized for execution)

## Repository rules

1. Production contract records belong in `smart-contract/deployments/`.
2. Frontend configuration must consume canonical deployment records rather than manually duplicated addresses.
3. Every address must be labeled by network and status: `production`, `testnet`, `legacy`, `simulation`, or `deprecated`.
4. Files must not claim “mainnet complete” unless transaction hashes, deployed bytecode, ownership, and explorer verification are retained.
5. Sentinel security contracts belong in `MastaTrill/Aetheron-Sentinel-L3`.

## Next cleanup pass

- Keep root README Base-first (already aligned).
- Move any remaining historical Polygon instructions into `docs/legacy/`.
- Remove generated build output and duplicate deployment records from version control where safe.
- Maintain one machine-readable portfolio contract registry.
