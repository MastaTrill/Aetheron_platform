# AETH Recovery Value Check — 2026-10-17

## On-chain state (Base Mainnet, 8453)

- Presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` (AetheronPresaleV2, verified)
- AETH balance: **4,900 AETH** (`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`)
- ETH balance: 0
- Last tx: Sep 7, 2026 — `withdrawUnsoldTokens` moved 33,328,433 AETH to deployer; owner refunded 0.0049 ETH
- No pending transactions

## Market reality

- **No canonical Base DEX pool exists.** `aetrs.com` and the canonical manifest both record "No canonical DEX market" / trading disabled.
- WhatToFarm (Oct 14): DEX TVL $0, 0 pairs, 0 txns, price $0.00001053 (stale/derived).
- Coinbase does not list Base AETH.
- The Solana AETH (pump.fun mint `DGNic...hDpump`, ~$0.000066 on CoinGecko/PumpSwap) is a **different token** — unrelated supply and contract.
- Legacy Polygon AETH pairs (`0x5de19d8c...`, `0xab5ae0d8...`) are also separate deployments with their own thin liquidity.

## Conclusion

4,900 Base AETH is inventory recovery, not a cash event. Expect near-zero USD until a real Base liquidity pool is created under a separate approved authorization. The 50M V1 AETH on the invalid sale (`0xA7aa...b07C`) remains parked with no verified rescue function.

Owner still needs to sign `withdrawUnsoldTokens()` (`0xc8bdbfb6`) to pull the 4,900 into the treasury wallet.
