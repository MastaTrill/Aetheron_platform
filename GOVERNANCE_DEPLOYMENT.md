# Governance Deployment Status


> [!WARNING]
> **Production notice:** this document contains legacy Polygon / QuickSwap material. Do not treat those references as the current production path.
> The canonical production network is **Base Mainnet (Chain ID 8453)**. Current AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`. The recorded Base presale has ended, refunds are available, and no canonical Base liquidity pool is live.
> For current truth, use [`README.md`](./README.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md), [`docs/PRODUCTION_READINESS_EVIDENCE.md`](./docs/PRODUCTION_READINESS_EVIDENCE.md), and the machine-readable Base deployment records under `smart-contract/deployments/`.

This file intentionally does not contain executable deployment instructions. The superseded Polygon governance deployment guide remains available in Git history.

`AetheronGovernance.sol` is an experimental, non-production contract. It has not completed the independent security review, role/economic review, Base rehearsal, and explicit release authorization required for production deployment. It is **not production-authorized** and is **not authorized for Base Mainnet**.

Do not deploy the experimental governance contract, custom multisig treasury, or Vendor contract with production funds. Canonical Base release state is controlled by the current deployment manifests and release gates, not by historical deployment guides.