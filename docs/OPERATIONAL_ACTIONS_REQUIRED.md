# Operational Actions Required

Repository safeguards are implemented. The following items are intentionally not executed by code changes because they require wallet funds, explicit transaction parameters, external review, or signer approval.

## AETH ownership

- Review every owner-only function on the deployed Base mainnet token.
- Select the production Safe/multisig address.
- Select the production timelock and delay.
- Simulate ownership transfer.
- Execute transfer only through a reviewed live-action workflow and record the transaction hash.

## Trading and liquidity

Trading remains disabled until all launch gates pass.

Before enabling trading or adding liquidity:

- record exact token and ETH amounts;
- record slippage and deadline limits;
- verify treasury and liquidity recipient addresses;
- complete two-person review;
- verify incident-response and pause procedures;
- archive the resulting transaction hashes and pool address.

## Presale

No presale is authorized merely because deployment scripts exist.

Before starting a presale:

- complete the Base Sepolia rehearsal;
- independently review the presale source and configuration;
- record exact sale window, hard cap, purchase limits, treasury, refund, claim, and cancellation behavior;
- verify ownership, funding, and token allocation;
- approve an immutable production commit;
- archive source-verification and transaction evidence.

## Secret rotation

The tracked-file scanner blocks obvious new secret material. It cannot prove that an older secret was never exposed. Rotate any private key, mnemonic, API key, webhook secret, or authenticated RPC credential that was ever committed, pasted into logs, or used in a public frontend.

## Execution rule

Use `scripts/check-operational-launch-gates.mjs` before any live operation. A passing repository gate is necessary but does not itself execute or authorize an on-chain transaction.
