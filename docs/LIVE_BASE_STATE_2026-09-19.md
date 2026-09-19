# Live Base state — 2026-09-19

Source: `eth_call` / `eth_getBalance` against `https://base.drpc.org` at block **51514063**.
Explorer corroboration: https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d

## Presale `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`

| Field | Live value |
|---|---|
| owner | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| token | `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| finalized | false |
| cancelled | false |
| refundsAvailable | **true** |
| weiRaised (accounting) | 0.0049 ETH |
| tokensReserved | **0** |
| ETH balance | **0** |
| AETH balance | **4,900 AETH** |
| softCap | 5 ETH |
| hardCap | 33.333333 ETH |
| rate | 1,000,000 |
| startTime / endTime | 1784405200 / 1785614800 |
| owner contributions | 0 |
| owner tokensOwed | 0 |
| owner refunded | **true** |

## V1 token `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`

- `tradingEnabled`: true (one-way; do not call `enableTrading()` again)

## Transaction history on the canonical presale (all from owner)

| Tx | Action | Note |
|---|---|---|
| `0xd16ffbfe…fa5728` | buyTokens 0.0003 ETH | recorded smoke |
| `0x89582326…68dda8` | buyTokens 0.0003 ETH | owner |
| `0x771ff5b1…87694b` | buyTokens 0.0003 ETH | owner |
| `0x91960336…0ca754` | buyTokens 0.004 ETH | owner |
| `0xc1aa3ba5‧2acfacb` | withdrawUnsoldTokens | ~11 days before this note; pulled inventory above reserved |
| `0xbf43f258…40f83cbf` | claimRefund | returned **0.0049 ETH** to owner |

There are no third-party contribution transactions on this contract. The only buyer was the owner EOA.

## Interpretation

1. Soft cap missed. Do not finalize.
2. Contributor ETH is already out. Contract ETH balance is 0. `claimRefund` for the owner is already done.
3. `tokensReserved` is 0 because the refund cleared reserved accounting, but **4,900 AETH remains on the contract**. That leftover is now unsold inventory and can be pulled with a second `withdrawUnsoldTokens()` from the owner wallet.
4. Optional `cancel()` still not sent. Not required.
5. Public purchases stay disabled.

## Still requires the owner wallet (cannot be done from this operator session)

```text
cast send 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "withdrawUnsoldTokens()" --rpc-url https://mainnet.base.org
```

Expect ~4,900 AETH to return to `0x15b9F8…B7C2`. Then re-read `token.balanceOf(presale)` and confirm 0.
