# AETH V1 migration snapshot — 2026-10-26

This is read-only migration evidence. It does not authorize V2 deployment, migration, liquidity, trading, or any token transfer. It supersedes, but does not modify, [the 2026-09-19 snapshot](AETH_V1_MIGRATION_SNAPSHOT_2026-09-19.md).

Source: a pinned Multicall3 read (`npm run verify:aeth-v1-migration-snapshot`) against Base Mainnet at block **53120460** (`0x834db4213b2e21b3d4207d35c8517594e28dae350a479901d6982fbbfe1395df`). The canonical V1 total supply was **1,000,000,000 AETH** with 18 decimals.

| Role | Address | AETH |
|---|---|---:|
| Former owner/operator | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` | 4,900 |
| Platform treasury | `0xA4737aa4b1E8a3C8f221BE9E55F5BDa307eCC1Fa` | 33,328,433 |
| Unclassified security-transfer destination | `0x43b18F8fB488E30d524757d78DA1438881d1AAAA` | 416,666,667 |
| Team | `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784` | 200,000,000 |
| Marketing and staking | `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452` | 300,000,000 |
| Invalid historical presale | `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` | 50,000,000 |
| Closed replacement presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` | 0 |
| **Reconciled total** | | **1,000,000,000** |

Change since 2026-09-19:

- Block 53115030 (2026-10-26 07:56:47 CDT / 12:56:47 UTC): the owner called `withdrawUnsoldTokens()` on the closed replacement presale, moving exactly 4,900 AETH (the unsold inventory) to the owner wallet in transaction [`0x95b85d8863adcde0ee5909390ef4bd13e7436946b03635e0de909549e670d66f`](https://basescan.org/tx/0x95b85d8863adcde0ee5909390ef4bd13e7436946b03635e0de909549e670d66f).

All other balances and total supply are unchanged from 2026-09-19. The custody-review blocker for `0x43b18F8fB488E30d524757d78DA1438881d1AAAA` remains open.
