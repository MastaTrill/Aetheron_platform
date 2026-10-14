# Owner signing card — AETH recovery (2026-10-14)

**Network:** Base Mainnet (chain ID 8453)
**Owner / treasury EOA:** `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
**Do not paste private keys, seeds, or authenticated RPCs into chat, git, or CI.**

This card prepares the two open recovery actions tracked in issues #254 and #255. Owner is an EOA; no Safe/multisig is currently required for these calls. Confirm on BaseScan before signing.

## 1. Current (valid) presale — issue #254 (4,900 AETH)

Address: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`

Live state (as of prior 2026-09-19 read; re-confirm on BaseScan):
- finalized = false, cancelled = false
- refundsAvailable = true (endTime passed + weiRaised < softCap)
- ETH balance = 0
- tokensReserved = 0
- AETH balanceOf(contract) ≈ 4,900

### Primary action (recommended)

Call `withdrawUnsoldTokens()` from the owner wallet.

- To: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
- Value: `0`
- Data / calldata: `0xc8bdbfb6`
- Selector: `withdrawUnsoldTokens()`

**BaseScan Write Contract:** https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d#writeContract

Steps:
1. Switch wallet to Base.
2. Connect `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
3. Open Write Contract → `withdrawUnsoldTokens` → Write.
4. Confirm receipt. Expect ~4,900 AETH transferred to the owner address.
5. Record the tx hash in `smart-contract/deployments/presale-base.json` (or a new recovery note) and close #254.

Prior `eth_call` from owner (2026-09-19) succeeded (`0x`). Re-simulate if desired before broadcasting.

### Optional action

Call `cancel()` for an explicit `Cancelled` event.

- Data: `0xea8a1af0`
- Not required (refundsAvailable is already true). Safe if desired for clarity.

### Do not call

| Function | Selector | Reason |
|---|---|---|
| `finalize()` | `0x4bb278f3` | Reverts: Softcap not met |
| `withdrawFunds()` | `0x24600fc3` | Reverts: Presale not finalized |
| Any buy or schedule mutators | — | Sale is closed; do not reopen |

## 2. Invalid / superseded presale — issue #255 (50M V1 AETH)

Address: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`

- Source **not verified** on BaseScan.
- Already cancelled (single historical tx).
- `token()` points at a non-V1 address.
- Holds **50,000,000** canonical V1 AETH as an ERC-20 balance (not via its own token accounting).
- ETH balance 0.

**Recovery status:** `withdrawUnsoldTokens()` on this older bytecode is documented to revert (`Presale not finalized`). Because `token()` ≠ V1, even a successful call would not move the V1 tokens.

**Recommended next steps (owner wallet):**
1. On BaseScan, inspect the contract (or decompile) for any rescue / emergencyWithdraw / execute / Ownable token-transfer function that can move arbitrary ERC-20 balances.
2. If a safe owner-only recovery function exists, simulate then call it.
3. If none exists, the 50M V1 AETH remain parked on this address. Mark the address `deprecated` in the registry and leave the tokens. Do **not** send additional tokens into it. Do **not** finalize it.

Do not route recovered tokens into any V2 deployment until a separate approval issue exists.

## After recovery

- Update `PROJECT_STATUS.md` and `smart-contract/deployments/presale-base.json` with tx hashes.
- Close #254 and #255 once confirmed on-chain.
- No V2, no new liquidity, no new public sale until a fresh authorization issue is opened and approved.

## Safety

- Confirm every address and calldata on BaseScan before signing.
- Owner is currently an EOA. If a multisig/Safe is later introduced, transfer ownership first and re-issue this card.
- Never call `finalize()` or `withdrawFunds()` on the current sale.
