# Aetheron Platform — Canonical Project Status

**Status:** Active flagship  
**Canonical role:** Commercial Aetheron product: AETH token, presale, staking, public frontend, wallet onboarding, and treasury-facing operations.

## Production truth

- Canonical production network: **Base Mainnet** (chain ID `8453`).
- Canonical AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Creation transaction: `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829`.
- Contract source verification is recorded in `smart-contract/deployments/aeth-base.json`.
- Token trading is currently recorded as disabled.
- Polygon Mumbai, Polygon mainnet, Solana, and any earlier AETH addresses are **legacy deployments** unless separately revalidated and entered into the canonical registry.

## In scope

- AETH token integration and verified contract registry
- Presale success, cancellation, refund, claim, and treasury-withdrawal paths
- Staking and emergency exits
- Public website and wallet experience
- Treasury, multisig, timelock, and operational controls
- Base Sepolia rehearsal and immutable launch evidence

## Out of scope

- Sentinel L3 security-suite development
- Experimental quantum, ZK, AI-security, bridge, or oracle contracts
- General-purpose AI agents
- Mobile or multichain experiments not required by the public platform

## Current launch gates

- [ ] Complete the protected Base Sepolia presale rehearsal.
- [ ] Preserve contract addresses, transaction hashes, block numbers, bytecode hashes, verification URLs, and manifest digest.
- [ ] Review owner, treasury, multisig, and timelock separation.
- [ ] Complete an independent smart-contract review.
- [ ] Authorize any Base mainnet presale action separately; testnet rehearsal does not authorize mainnet.
- [ ] Decide and document the trading-enablement and liquidity plan.
- [ ] Remove stale Polygon-first instructions from the public README.

## Repository rules

1. Production contract records belong in `smart-contract/deployments/`.
2. Frontend configuration must consume canonical deployment records rather than manually duplicated addresses.
3. Every address must be labeled by network and status: `production`, `testnet`, `legacy`, `simulation`, or `deprecated`.
4. Files must not claim “mainnet complete” unless transaction hashes, deployed bytecode, ownership, and explorer verification are retained.
5. Sentinel security contracts belong in `MastaTrill/Aetheron-Sentinel-L3`.

## Next cleanup pass

- Rewrite the root README around Base Mainnet.
- Move historical Polygon instructions into `docs/legacy/`.
- Remove generated build output and duplicate deployment records from version control where safe.
- Add one machine-readable portfolio contract registry.
