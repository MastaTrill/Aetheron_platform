# Aetheron Platform

Aetheron Platform is the canonical public repository for the Aetheron token ecosystem on Base.

## Canonical scope

This repository owns:

- the Aetheron token (`AETH`);
- presale contracts and launch controls;
- staking contracts;
- the public website and wallet experience;
- deployment evidence and treasury-facing operations.

Sentinel security contracts belong in [`MastaTrill/Aetheron-Sentinel-L3`](https://github.com/MastaTrill/Aetheron-Sentinel-L3). Legacy mobile and multichain prototypes belong in [`MastaTrill/Aetheron`](https://github.com/MastaTrill/Aetheron).

## Current production deployment

### Base mainnet

- Network: Base Mainnet
- Chain ID: `8453`
- Token: Aetheron
- Symbol: `AETH`
- Contract: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Creation transaction: `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829`
- Recorded owner: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Supply: `1,000,000,000 AETH`
- Source verification: recorded as verified on BaseScan
- Trading status in the canonical manifest: disabled

The machine-readable deployment record is:

`smart-contract/deployments/aeth-base.json`

Corrected Base presale (deployed; public launch still gated):

`smart-contract/deployments/presale-base.json` → `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`

The cross-project registry is:

`docs/AETHERON_CONTRACT_REGISTRY.json`

## Presale / public launch status

Contracts on Base are **not** the same as authorization to accept public funds, enable trading, or add liquidity.

Path behavior for the corrected presale is treated as evidenced by mainnet receipts plus the offline production suite (issue **#217** closed; see `docs/evidence/ISSUE_217_PATH_EVIDENCE_SUBSTITUTION_2026-09-04.md`).

**Base Sepolia is not a required step.** Scripts and runbooks may remain for optional operator practice only.

The remaining gate is issue **#219** (written Base Mainnet public-launch authorization). Until that issue records an explicit `approved` decision:

- keep `launchAuthorized: false` in public frontend config;
- do not enable trading;
- do not add canonical mainnet liquidity;
- do not market the presale as open to the public.

No README statement authorizes deployment actions, trading, liquidity, or acceptance of public funds.

## Repository truth rules

- Base mainnet is the current canonical production network.
- Polygon Mumbai, Polygon mainnet, Ethereum Sepolia, Base Sepolia, Solana, simulations, and local deployments must be labeled explicitly when referenced.
- Historical Polygon and Mumbai references are legacy records, not current production configuration.
- A deployment is only considered verified when its network, chain ID, contract address, creation transaction, deployer, owner, bytecode/source verification, and status are recorded together.
- Never copy a testnet address into production frontend configuration.

## Project status

See:

- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- [`AETHERON_PORTFOLIO.md`](./AETHERON_PORTFOLIO.md)
- [`docs/PRODUCTION_READINESS_EVIDENCE.md`](./docs/PRODUCTION_READINESS_EVIDENCE.md)

## Development

Smart-contract work is under `smart-contract/`. Install exact dependencies and run the repository tests before any deployment or verification action.

```bash
cd smart-contract
npm ci
npm test
```

Use dry-run and protected workflows for deployment preparation. Do not place private keys, API keys, mnemonic phrases, or authenticated RPC URLs in source control.

## Legacy history

Older Polygon, Mumbai, Solana, space-exploration, and broad ecosystem claims remain available through Git history. They are not the current canonical product definition unless separately revalidated and added to the contract registry.

## License

See the repository license file.
