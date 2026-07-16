# 🚀 FINAL STATUS — Aetheron Platform

**Last updated:** July 16, 2026

## Current deployment

| Area | Status | Details |
|---|---:|---|
| AETH token | ✅ Deployed | Base mainnet: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| Aetheron presale | ✅ Deployed | Base mainnet: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` |
| Network | ✅ Configured | Base mainnet, chain ID `8453`, native currency ETH |
| Frontend configuration | ✅ Updated | `presale-config.js` points to the Base contracts |
| Presale inventory | ⚠️ Verify on-chain | Confirm the presale's AETH balance covers remaining sales |
| Source verification | ⚠️ Verify on BaseScan | Both contracts should show verified source and matching constructor arguments |
| Purchase flow | ⚠️ Fix required | Frontend hard-cap calculation currently uses the soft-cap value |
| Dependency security | ⚠️ In progress | Open Snyk PRs require rebasing or manual upgrades and test validation |
| Liquidity | ⏳ Pending | Do not announce liquid trading until liquidity is funded and verified |

## Deployment record

The committed Base deployment record is:

- **AETH token:** `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- **Presale:** `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`
- **Owner:** `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- **Team:** `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784`
- **Marketing / staking:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **Deployment timestamp:** `2026-07-16T20:49:40.874Z`

## Required launch checks

1. Confirm both addresses contain contract bytecode on Base mainnet.
2. Confirm source code and constructor arguments are verified on BaseScan.
3. Read and record the presale's rate, soft cap, hard cap, contribution limits, start/end times, finalized/cancelled state, ETH raised, and AETH inventory.
4. Fix the frontend hard-cap assignment and run a simulated purchase against a Base mainnet fork or Base Sepolia deployment.
5. Rebase or replace stale Snyk PRs, regenerate lockfiles, and run compile/tests before merging.
6. Complete a small controlled purchase only after the read-only checks and simulation pass.

## Safety note

Do **not** redeploy by following older Polygon instructions. The active configuration is Base mainnet. Never commit private keys, RPC secrets, or wallet seed phrases.