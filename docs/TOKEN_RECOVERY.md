# Aetheron owner recovery runbook

**Do not paste a private key, seed phrase, or RPC auth token into chat, git, or CI.**

Canonical state:

| Item | Value |
|---|---|
| Network | Base Mainnet `8453` |
| AETH V1 | `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| Closed presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` |
| Owner / treasury | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| Raised | 0.0049 ETH (owner-only txs) |
| Leftover on sale | 4,900 AETH — issue #254 |
| Other inventory | 50M V1 AETH on cancelled invalid sale — issue #255 |
| V2 | prepared, unapproved — do not deploy |

## Decision before any new sale

1. Wind down V1 marketing and recover leftover tokens to treasury, or
2. Prepare a separately approved V2 sale. The current schedule cannot be reopened.

Do not build dashboard feature issues until one of those is done.

## #254 — 4,900 AETH

Owner wallet only. Confirm balance, call `withdrawUnsoldTokens()`, record the tx in `smart-contract/deployments/`, close #254.

## #255 — 50M on cancelled sale

Identify the address from the issue/registry only. Use only the documented owner recovery function. If none exists, mark the address `deprecated`.
