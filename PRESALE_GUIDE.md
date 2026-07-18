# Aetheron Base Presale Operations Guide

## Current status

- Network: Base mainnet (`chainId` 8453).
- Approved AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Owner and treasury: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
- Invalid cancelled presale: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`.
- Public purchases remain disabled because `presaleContractAddress` is blank.
- The obsolete Polygon deployment path must not be used.

## Approved production terms

- Rate: 1,000,000 AETH per ETH.
- Sale allocation: 33,333,333 AETH.
- Soft cap: 5 ETH.
- Hard cap: 33.333333 ETH.
- Minimum contribution: 0.001 ETH.
- Maximum cumulative contribution per wallet: 1 ETH.
- Start delay: 3,600 seconds.
- Duration: 1,209,600 seconds (14 days).

The 50,000,000 AETH locked in the invalid presale is not part of the replacement inventory.

## Required protected secrets

Configure the appropriate GitHub environments with:

- `BASE_DEPLOYER_PRIVATE_KEY`
- `ETHERSCAN_API_KEY` or `BASESCAN_API_KEY`
- `BASE_RPC_URL` is recommended; the workflow has a rate-limited public fallback.
- `BASE_FORK_RPC_URL` is optional and is used only for the diagnostic fork check.

Never place private keys or seed phrases in repository files, workflow inputs, issues, or logs.

## Deployment procedure

Use **Actions → Deploy Corrected Base Presale**. Do not run legacy deployment scripts directly.

### 1. Dry run

Select branch `main`, leave **Run all preflight checks without sending transactions** enabled, keep all approved values unchanged, and use:

```text
DRY_RUN
```

The run must pass compilation, unit tests, exact production simulation, live read-only checks, owner/token/inventory checks, and the protected signer check. A dry run sends no transaction.

### 2. Live deployment

Start a brand-new workflow run; do not rerun an old failed job. Disable dry run, keep every approved value unchanged, and enter:

```text
DEPLOY_CORRECTED_PRESALE
```

The owner-authorized workflow performs three bounded Base transactions:

1. Deploy `AetheronPresaleV2`.
2. Exclude the replacement from AETH transfer tax.
3. Fund it with exactly 33,333,333 AETH.

Each transaction hash is journaled immediately after broadcast and then updated after confirmation. The workflow verifies bytecode, constructor state, inventory, tax exclusion, liabilities, and BaseScan source verification.

## After deployment

A successful deployment publishes the replacement address for transparency while keeping:

```text
presaleContractAddress: ""
```

Public purchase controls stay disabled until all of the following are complete:

1. Review the deployment journal and transaction receipts.
2. Confirm BaseScan source and constructor-argument verification.
3. Confirm exact AETH inventory and tax exclusion.
4. Perform the separate owner-wallet 0.001 ETH smoke purchase.
5. Review applicable legal and disclosure requirements.
6. Record explicit launch authorization.

Do not activate public purchases automatically as part of deployment.
