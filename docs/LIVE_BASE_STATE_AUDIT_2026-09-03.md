# Live Base State Audit — 2026-09-03

This is a read-only production snapshot taken after merging PR #236. No state-changing transaction was authorized or executed during this audit.

## Canonical AETH token

- Network: Base Mainnet (chain ID 8453)
- Contract: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Name / symbol / decimals: Aetheron / AETH / 18
- Total supply: 1,000,000,000 AETH
- Owner: `0x15b9f8ecedafd69eb1dd93e51fe522690bf6b7c2`
- `tradingEnabled`: `true`
- `quickswapRouter`: zero address
- `liquidityPool`: zero address
- `buyTaxRate`: 3
- `sellTaxRate`: 5

### Transfer history

The token has only the constructor allocations plus two later transfers. No DEX-liquidity or secondary-market transfer activity was observed in the read-only history through this audit.

The owner balance shown by BaseScan is 416,666,667 AETH. The two later transfers were:

- 50,000,000 AETH to `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` (recorded by production configuration as the invalid presale contract)
- 33,333,333 AETH to `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` (replacement presale)

## Replacement presale

- Contract: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
- Token: canonical AETH contract above
- Owner: `0x15b9f8ecedafd69eb1dd93e51fe522690bf6b7c2`
- Treasury: `0x15b9f8ecedafd69eb1dd93e51fe522690bf6b7c2`
- Original window: 2026-07-18 20:06:40 UTC through 2026-08-01 20:06:40 UTC
- Soft cap: 5 ETH
- Hard cap: 33.333333 ETH
- `weiRaised`: 0.0049 ETH
- `tokensReserved`: 4,900 AETH
- `finalized`: false
- `cancelled`: false
- `refundsAvailable`: true
- Current AETH balance: 33,333,333 AETH

All four observed ETH contributions (0.0003, 0.0003, 0.0003, and 0.004 ETH) originated from the owner address above. No outside contributor was observed in that transfer history.

## Launch blockers found

1. The token's one-way `tradingEnabled` flag is already on-chain, so a new `enableTrading()` call is neither required nor appropriate.
2. No DEX router or canonical liquidity pool is configured in the token.
3. The replacement presale's original window has expired and refunds are available; production configuration correctly keeps public purchases blocked.
4. The current token logic marks a router/pool as tax-exempt when it is configured. Because `_transfer` returns early for tax-exempt addresses, configured DEX trades would bypass the stored 3% buy / 5% sell tax logic. Public tax claims must not be treated as effective DEX economics without resolving this design mismatch.
5. No canonical Base staking deployment is present in `smart-contract/deployments`; staking remains a planning feature.

## Safe release posture

Public purchase controls should remain disabled until the project deliberately resolves the intended DEX/tax model, creates and verifies canonical Base liquidity, resolves or replaces the expired presale schedule, and updates public launch-status copy to match live on-chain state.

Do not use the `tradingEnabled` boolean by itself as evidence that a liquid public market is live.
