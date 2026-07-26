# Aetheron Repository Map

This file defines the canonical role of each Aetheron repository and prevents overlapping deployment claims.

| Repository | Status | Canonical role |
|---|---|---|
| `MastaTrill/Aetheron_platform` | Active flagship | AETH token, presale, staking, public frontend, wallet onboarding, treasury operations |
| `MastaTrill/Aetheron-Sentinel-L3` | Active security flagship | Interceptor, circuit breaker, rate limiter, monitoring, security release evidence |
| `MastaTrill/Aetheron` | Maintenance / consolidation | Legacy mobile, multichain, SDK, and application prototypes |
| `MastaTrill/Aetheron-X` | Incubating | API gateway only, if retained |
| `MastaTrill/Aether.ion` | Private internal lab | Internal blockchain automation and security tooling |
| `MastaTrill/bridge-contracts` | Reference/vendor | Upstream bridge-contract reference; not canonical Aetheron deployment code |

## Deployment authority

- Base Mainnet AETH deployment truth belongs in `Aetheron_platform/smart-contract/deployments/`.
- Sentinel deployment truth belongs in `Aetheron-Sentinel-L3/docs/DEPLOYMENT_ADDRESSES.md` plus machine-readable release manifests.
- No other repository may declare a production token or Sentinel deployment canonical without updating the appropriate registry.

## Status labels

Every contract or address must be labeled as exactly one of:

- `production`
- `testnet`
- `legacy`
- `simulation`
- `deprecated`
- `pending`

## Consolidation policy

1. Preserve Git history; do not delete repositories until unique code is inventoried.
2. Move production code into canonical repositories through reviewed pull requests.
3. Replace duplicate deployment instructions with links to canonical registries.
4. Archive repositories only after unique code, issues, and release evidence have been migrated.
5. Do not market experimental contracts as audited or production-deployed.
