# Aetheron Repository Map

This file defines the canonical role of each Aetheron repository and prevents overlapping deployment claims.

Updated: 2026-09-19.

| Repository | Status | Canonical role |
|---|---|---|
| `MastaTrill/Aetheron_platform` | Active flagship | AETH token, expired Base presale, staking, public frontend, treasury ops |
| `MastaTrill/Aetheron-Sentinel-L3` | Active security flagship | Interceptor, circuit breaker, monitoring, security evidence |
| `MastaTrill/Emvori` | Active independent product | Private AI workspace; not an Aetheron token surface |
| `MastaTrill/emvori-status` | Public status | Emvori continuity page only |
| `MastaTrill/Aetheron` | Legacy / not production | Old prototypes. Do not treat GitHub Pages demo as live AETH. |
| `MastaTrill/Aetheron-X` | Incubating | API gateway only, if retained |
| `MastaTrill/Aether.ion` | Private lab | Internal tooling |
| `MastaTrill/ASL3` | Duplicate | Do not declare a second Sentinel production |
| `MastaTrill/AetheronSentinelL3App` | Duplicate | App shell; not canonical |
| `MastaTrill/Sentinel` | Stub | Not canonical |
| `MastaTrill/Aetheron_platform-1` | Leftover | CircleCI setup clone; archive candidate |
| `MastaTrill/as3grok` | Scratch | Not production |
| `MastaTrill/JarvisAI` | Idle | Unrelated / historical |
| `MastaTrill/Titan-OMNI-AI` | Idle | Unrelated / historical |
| `MastaTrill/AileadBooking` | Idle | Unrelated |
| `MastaTrill/cosmic-echo-identity` | Private | Identity experiments |
| `MastaTrill/aetheron-launch-storyboard` | Private | Story only |
| `MastaTrill/jarvis-echo-dashboard` | Idle | Historical |
| `MastaTrill/bridge-contracts` | Reference/vendor | Not canonical Aetheron deployment code |

## 2026-09-19 production rules

- Canonical network is Base Mainnet.
- Canonical V1 token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Canonical expired presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` (missed 5 ETH soft cap; purchases closed).
- No other repository may advertise a live AETH presale, a filled raise, or a replacement production token.
- V2 remains prepared and unapproved in `Aetheron_platform` only.

## Deployment authority

- Base Mainnet AETH deployment truth belongs in `Aetheron_platform/smart-contract/deployments/`.
- Sentinel deployment truth belongs in `Aetheron-Sentinel-L3/docs/DEPLOYMENT_ADDRESSES.md` plus machine-readable release manifests.
- No other repository may declare a production token or Sentinel deployment canonical without updating this file.

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
