# Aetheron Platform — Canonical Project Status

**Status:** Active flagship  
**Last updated:** 2026-09-04  
**Canonical role:** Commercial Aetheron product: AETH token, presale, staking, public frontend, wallet onboarding, and treasury-facing operations.

## Production truth

- Canonical production network: **Base Mainnet** (chain ID `8453`).
- Canonical AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- AETH creation transaction: `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829`.
- AETH source verification is recorded in `smart-contract/deployments/aeth-base.json`.
- Corrected Base presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- Presale deployment transaction: `0x7ac118e87c317b8c8cad669fac7fd04788529181fac8b577ee182d01a4270326`.
- The corrected presale is deployed, funded, source-verified, and has a recorded owner smoke purchase in `smart-contract/deployments/presale-base.json`.
- **Deployment is not launch authorization.** Frontend must keep `launchAuthorized: false` and `status: "pending_final_authorization"` until issue **#219** is explicitly approved.
- Token trading is recorded as **disabled** in the canonical token record (`tradingEnabled: false`).
- The older Base presale `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` is invalid/legacy and must not be used for public purchases.
- Polygon Mumbai, Polygon mainnet, Solana, and any earlier AETH addresses are **legacy deployments** unless separately revalidated and entered into the canonical registry.

## Cross-project Sentinel deployment truth

Sentinel L3 is maintained in `MastaTrill/Aetheron-Sentinel-L3`, not in the Platform smart-contract tree.

- A live SENTINEL token exists on Base Mainnet at `0x8c1eb8db47d52a8b5e2b1eb4e5ec9491ce030ba3`.
- Classified as **legacy/non-canonical** for current Sentinel production release status.

Canonical portfolio registry: `docs/AETHERON_CONTRACT_REGISTRY.json`.

## In scope

- AETH token integration and verified contract registry
- Presale success, cancellation, refund, claim, and treasury-withdrawal paths
- Staking and emergency exits
- Public website and wallet experience
- Treasury, multisig, timelock, and operational controls
- Launch authorization evidence (#219)

## Out of scope

- Sentinel L3 security-suite development (see `MastaTrill/Aetheron-Sentinel-L3`)
- Experimental quantum, ZK, AI-security, bridge, or oracle contracts
- General-purpose AI agents (including Emvori)
- Mobile or multichain experiments not required by the public platform

## Current launch gates

- [x] Path-evidence for presale behavior — **#217 closed** via mainnet receipts + offline suite substitution (`docs/evidence/ISSUE_217_PATH_EVIDENCE_SUBSTITUTION_2026-09-04.md`). Sepolia dress rehearsal is optional, not required.
- [x] Finish Base-only migration cleanup (#214)
- [x] Trading/liquidity plan draft — `docs/TRADING_AND_LIQUIDITY_PLAN.md` (execution blocked until #219)
- [x] AETH V2 prepared on `main` as `prepared_not_deployed` (not cut over)
- [ ] Review owner / treasury / multisig / timelock separation (owner currently equals treasury in records)
- [ ] Independent smart-contract review
- [ ] **#219** written Base Mainnet public-launch authorization (exact commit SHA, addresses, caps, trading/liquidity plan)

**Public launch remains NO-GO until #219 is approved.**

## Repository rules

1. Production contract records belong in `smart-contract/deployments/`.
2. Frontend configuration must consume canonical deployment records rather than manually duplicated addresses.
3. Every address must be labeled by network and status: `production`, `deployed-disabled`, `testnet`, `legacy`, `simulation`, or `deprecated`.
4. Deployment state and launch authorization stay separate.
5. Sentinel security contracts belong in `MastaTrill/Aetheron-Sentinel-L3`.

## Next real work (priority order)

1. **#219** — independent review + privilege separation + written auth for public funds/trading/liquidity.  
2. Optional: staking smoke if staking is part of day-one public surface.  
3. Optional: Sepolia dress rehearsal (scripts remain) for operator confidence only.  
4. Optional: dashboard reliability backlog after launch path is clear.
