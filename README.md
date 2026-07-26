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

The cross-project registry is:

`docs/AETHERON_CONTRACT_REGISTRY.json`

## Presale status

The Base presale and staking release is not considered production-approved merely because code or older deployments exist.

The required path is:

1. protected Base Sepolia readiness;
2. guarded rehearsal deployment;
3. success, refund, staking, and privilege-path execution;
4. BaseScan verification;
5. immutable evidence review;
6. explicit mainnet authorization.

No README statement should be treated as authorization to deploy, enable trading, add liquidity, or accept public funds.

## Repository truth rules

- Base mainnet is the current canonical production network.
- Polygon Mumbai, Polygon mainnet, Ethereum Sepolia, Base Sepolia, Solana, simulations, and local deployments must be labeled explicitly.
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