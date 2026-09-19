# Owner wallet checklist — 2026-09-19

Use owner EOA `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` on **Base**. Network 8453 only.

## 1. Current sale leftover (do this first)

Contract: https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d#writeContract

Call **`withdrawUnsoldTokens()`**.
Expected: ~4,900 AETH move to the owner wallet.

Do **not** call `finalize()` or `withdrawFunds()`.

Issue: https://github.com/MastaTrill/Aetheron_platform/issues/254

## 2. Cancelled invalid sale (inspect before signing)

Contract: https://basescan.org/address/0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C#writeContract

Already `cancelled = true`. ETH balance 0. `token()` is NOT V1.
Canonical V1 `balanceOf(this)` was **50,000,000 AETH** at block 51514452.

Only call a withdraw/rescue function after you read the verified ABI on BaseScan.
Do not send those tokens into V2.

Issue: https://github.com/MastaTrill/Aetheron_platform/issues/255

## 3. Leave alone

- Emvori Play v20 / PR #111
- V2 deploy
- New presale
- Liquidity
- `enableTrading()` (already on)
