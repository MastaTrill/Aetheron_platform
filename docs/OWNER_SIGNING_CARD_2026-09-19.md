# Owner signing card — current sale leftover

Simulated 2026-09-19 on Base block ~51514713 via `eth_call` from `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.

## Do this

Network: **Base (8453)**
To: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
Value: `0`
Data: `0xc8bdbfb6`  (`withdrawUnsoldTokens()`)

BaseScan Write Contract: https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d#writeContract

Connect the owner wallet → `withdrawUnsoldTokens` → Write.

`eth_call` from owner returned `0x` (success). After the tx, expect ~4,900 AETH in the owner wallet.

## Do not press

| Function | Selector | Simulated result |
|---|---|---|
| `finalize()` | `0x4bb278f3` | revert `Softcap not met - cancel and refund instead` |
| `withdrawFunds()` | `0x24600fc3` | revert `Presale not finalized` |
| `cancel()` | `0xea8a1af0` | would succeed (optional only) |

## Invalid sale `0xA7aa36…b07C`

Already cancelled. `withdrawUnsoldTokens()` reverts `Presale not finalized` on that older bytecode. `token()` is not V1, so that function would not pull the 50M V1 sitting on the address anyway. Separate recovery only after ABI check. Do not finalize it.
