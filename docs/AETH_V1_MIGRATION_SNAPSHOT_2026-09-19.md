# AETH V1 migration snapshot — 2026-09-19

This is read-only migration evidence. It does not authorize V2 deployment, migration, liquidity, trading, or any token transfer.

Source: a pinned Multicall3 read against Base Mainnet at block **51514279** (`0xd15db1b4504085a9f9cb21dc7a25e3f8c11b9a726a3087837fad20a70fa51c5d`). The canonical V1 total supply was **1,000,000,000 AETH** with 18 decimals.

| Role | Address | AETH |
|---|---|---:|
| Former owner/operator | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` | 0 |
| Platform treasury | `0xA4737aa4b1E8a3C8f221BE9E55F5BDa307eCC1Fa` | 33,328,433 |
| Unclassified security-transfer destination | `0x43b18F8fB488E30d524757d78DA1438881d1AAAA` | 416,666,667 |
| Team | `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784` | 200,000,000 |
| Marketing and staking | `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452` | 300,000,000 |
| Invalid historical presale | `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` | 50,000,000 |
| Closed replacement presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` | 4,900 |
| **Reconciled total** | | **1,000,000,000** |

The closed replacement presale has zero reserved tokens and zero ETH after the owner refund. Its remaining 4,900 AETH is unsold inventory pending an explicit owner `withdrawUnsoldTokens()` transaction. That transaction was not submitted during this snapshot.

Transfer history corroboration:

- Block 51009586: 33,328,433 AETH moved from the former owner/operator to the platform treasury in transaction `0x2df64207bdf1ec8ecb4aeda4262963e6ff6a6d841ae032e25fc4c8e94345ea90`.
- Block 51010746: 416,666,667 AETH moved from the former owner/operator to `0x43b18F8fB488E30d524757d78DA1438881d1AAAA` in transaction `0x62e1682c4ffda03da7d1db9b23e764ee98e40c310ba456f7dde0077c0ab23e1c`.

The repository does not contain evidence establishing control of the second destination. It is therefore an explicit custody-review blocker: do not classify that balance as an owner migration reserve or assign a V2 destination until control and intent are independently verified.
