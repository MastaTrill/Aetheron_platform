# Aetheron owner recovery runbook

**Do not paste a private key, seed phrase, or RPC auth token into chat, git, or CI.**

Canonical state on 2026-09-19 / still open 2026-09-25:

| Item | Value |
|---|---|
| Network | Base Mainnet `8453` |
| AETH V1 | `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| Closed presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` |
| Owner / treasury | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| Raised | 0.0049 ETH (owner-only txs; no third-party buyers) |
| Sale contract ETH | 0 (owner refunded) |
| Leftover on sale | **4,900 AETH** — issue `#254` |
| Other inventory | **50M V1 AETH on cancelled invalid sale** — issue `#255` |
| V2 | prepared, unapproved — do not deploy |

## Decision (required before any new sale)

Pick one and write it in `PROJECT_STATUS.md`:

1. **Wind down V1 marketing.** Recover leftover tokens to treasury. Keep the verified token. No V2 until there is actual demand.
2. **Prepare V2 only.** New sale requires a new contract, new approval issue, source verification, smoke test, registry update, then `purchaseAuthorized: true`. The current sale schedule cannot be reopened.

Do not build dashboard feature issues (#96–#115) until one of those is done.

## `#254` — 4,900 AETH on the closed presale

1. On BaseScan, open the presale contract.
2. Connect the **owner** wallet only.
3. Confirm remaining token balance is 4,900 AETH.
4. Call `withdrawUnsoldTokens()`.
5. Confirm tokens arrived at treasury.
6. Record tx hash in `smart-contract/deployments/` and close `#254`.

If the function reverts, stop. Do not send ETH at the sale.

## `#255` — 50M on cancelled invalid sale

1. Identify the cancelled-sale address from the issue body / registry. Do not guess from old Polygon notes.
2. Read `owner()`, cancelled/finalized, and token balance on Base.
3. Use only the contract's documented owner recovery function.
4. If there is no safe withdraw, leave tokens parked and mark the address `deprecated` in the registry.
