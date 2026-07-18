# Aetheron Base Presale Operations Guide

## Current status

- Network: Base mainnet (`chainId` 8453).
- Approved AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Owner and treasury: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
- Invalid cancelled presale: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`.
- Verified replacement presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- The obsolete Polygon deployment path must not be used.

## Approved production terms

- Rate: 1,000,000 AETH per ETH.
- Sale allocation: 33,333,333 AETH.
- Soft cap: 5 ETH.
- Hard cap: 33.333333 ETH.
- Minimum contribution: 0.0003 ETH.
- Maximum cumulative contribution per wallet: 33.333333 ETH, additionally bounded by the remaining global hard cap.
- Start delay: 3,600 seconds.
- Duration: 1,209,600 seconds (14 days).

The 50,000,000 AETH locked in the invalid presale is not part of the replacement inventory.

## Required protected secrets

Configure the appropriate GitHub environments with:

- `BASE_DEPLOYER_PRIVATE_KEY`
- `ETHERSCAN_API_KEY` or `BASESCAN_API_KEY`
- `BASE_RPC_URL` is recommended; workflows have a rate-limited public fallback.
- `BASE_FORK_RPC_URL` is optional and is used only for diagnostic fork checks.

Never place private keys or seed phrases in repository files, workflow inputs, issues, or logs.

## Deployment procedure

Use **Actions → Deploy Corrected Base Presale**. Do not run legacy deployment scripts directly.

### 1. Dry run

Select branch `main`, leave **Run all preflight checks without sending transactions** enabled, keep all approved values unchanged, and use `DRY_RUN`. A dry run sends no transaction.

### 2. Live deployment

Start a brand-new workflow run; do not rerun an old failed job. Disable dry run, keep every approved value unchanged, and enter `DEPLOY_CORRECTED_PRESALE`.

The workflow deploys `AetheronPresaleV2`, excludes it from AETH transfer tax, funds exactly 33,333,333 AETH, verifies live state, and submits BaseScan verification. Deployment does not enable public purchases.

## Owner smoke purchase and launch

Use **Actions → Owner Smoke Purchase and Enable Presale** only after reviewing the deployment journal, transaction receipts, verified source and constructor arguments, inventory, tax exclusion, and applicable legal/disclosure requirements.

Enter exactly:

```text
SMOKE_TEST_AND_ENABLE_PUBLIC_PRESALE
```

The protected workflow:

1. Re-runs tests and live read-only validation.
2. Confirms the signer, owner, token, rate, contribution limits, inventory, and sale window.
3. Simulates `buyTokens()` with exactly 0.0003 ETH.
4. Broadcasts the owner smoke purchase and waits for confirmation.
5. Confirms `weiRaised`, `contributions`, and `tokensOwed` increased by the exact expected amounts.
6. Records the receipt and enables `presaleContractAddress` only after all checks pass.

Do not rerun a failed launch job without first checking whether a smoke-purchase transaction was broadcast and recorded on Base.
