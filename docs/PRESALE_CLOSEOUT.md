# Base V1 Presale Close-Out Runbook

**Date:** 2026-09-19
**Decision:** Missed soft cap. Refund path. Do not finalize. Do not deploy V2 from this action.

## Addresses

| Role | Value |
|---|---|
| Network | Base Mainnet, chainId `8453` |
| AETH V1 | `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| Canonical presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` |
| Invalid prior presale | `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` |
| Owner / treasury | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| Explorer (canonical sale) | https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d#code |
| Deploy tx | `0x7ac118e87c317b8c8cad669fac7fd04788529181fac8b577ee182d01a4270326` |

Verified implementation name on BaseScan: `AetheronPresaleV2` (`project/contracts/AetheronPresale.sol:AetheronPresaleV2`).

## Recorded sale terms

From `smart-contract/deployments/presale-base.json`:

- Rate: `1,000,000` AETH per ETH (`tokens = msg.value * rate`)
- Soft cap: `5 ETH`
- Hard cap: `33.333333 ETH`
- Min contribution: `0.0003 ETH`
- Start / end unix: `1784405200` / `1785614800` (end = 2026-08-01 20:06:40 UTC)
- Inventory funded at deploy: `33,333,333` AETH
- Owner smoke buy: `0.0003 ETH` for `300` AETH (`0xd16ffbfe89c9a72d9fec77bf72642092f1e2593868bb01ad872dc83bf2fa5728`)

Last dedicated read-only check in `PROJECT_STATUS.md` (2026-09-05):

- `weiRaised`: `0.0049 ETH`
- `tokensReserved`: `4,900 AETH`
- `refundsAvailable`: `true`
- `finalized`: `false`
- `cancelled`: `false`

Re-read these on-chain immediately before any owner transaction. Do not use this file as a substitute for a live `eth_call`.

## Why finalize is forbidden

```solidity
function finalize() external onlyOwner {
    require(weiRaised >= softCap, "Softcap not met - cancel and refund instead");
}
```

`0.0049 ETH < 5 ETH`. `finalize()` must revert. `withdrawFunds()` requires `finalized`, so owner cannot sweep contributor ETH. That is working as designed.

## Why refunds already work without cancel()

```solidity
function refundsAvailable() public view returns (bool) {
    if (finalized) return false;
    if (cancelled) return true;
    return block.timestamp > endTime && weiRaised < softCap;
}
```

Window ended and soft cap missed, so refunds are already live. `cancel()` only adds an explicit `Cancelled` event and keeps the same refund path.

## Contributor path (required)

Each buyer, from the **same wallet that contributed**, on Base:

1. Confirm `contributions(wallet) > 0` and `refunded(wallet) == false`.
2. Call `claimRefund()` with empty calldata. No ETH value.
3. Confirm `RefundClaimed` and that wallet ETH increased by the contribution.
4. Confirm `tokensOwed(wallet) == 0` and `refunded(wallet) == true`.

Owner cannot call `claimRefund()` on someone else's behalf. The refund is paid to `msg.sender`.

Write this on the public site / README in plain language. Do not imply tokens will be delivered from this sale.

## Owner transaction checklist

Do these in order. Stop if any pre-check fails.

### 0. Live pre-check (read-only)

On `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` record:

- `owner()` equals `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- `token()` equals V1 AETH
- `finalized()` false
- `cancelled()` current value
- `refundsAvailable()` true
- `weiRaised()`
- `tokensReserved()`
- `address(presale).balance` (ETH)
- `token.balanceOf(presale)` (AETH)
- Known `contributions(owner)` from the smoke buy

If `finalized()` is ever true, abort this runbook. That state is not the 2026-09-05 record and needs a separate incident review.

### 1. Optional: `cancel()`

- Caller: owner only
- Effect: `cancelled = true`, emit `Cancelled`
- Does not move ETH or tokens
- Safe while `!finalized && !cancelled`
- Skip if already cancelled

### 2. Owner smoke-buy refund

Owner also bought `0.0003 ETH` in the recorded smoke test. That ETH is escrowed like any other contribution.

- From owner wallet, call `claimRefund()`
- Expect ~`0.0003 ETH` returned (plus any later owner contributions)
- Do this before talking publicly so the first refund tx is your own proof

### 3. Do not call

- `finalize()`
- `withdrawFunds()`
- `updateSchedule` / `updateRate` / `updateCaps` / `updateContributionLimits` (all locked)
- `enableTrading()` on V1
- Any liquidity add for V1
- Any V2 deploy, mint, or lock fund
- Any transfer of V2 into this presale

### 4. `withdrawUnsoldTokens()` only after reserved inventory is understood

```solidity
uint256 unsold = token.balanceOf(address(this)) - tokensReserved;
```

- Allowed when `finalized || refundsAvailable()` — refunds already make this true
- This withdraws **inventory above `tokensReserved`**, not the reserved slice
- Reserved AETH drops only when a buyer `claimRefund()`s or (in a success path) `claimTokens()`s
- Preferred sequence: wait until `tokensReserved == 0` after refunds, then withdraw the full remaining AETH inventory to owner
- If you withdraw early, leave at least `tokensReserved` AETH in the contract so accounting cannot go insolvent if a late refund races you (refunds burn reserved accounting and return ETH, they do not need the reserved AETH; still keep the books clean)

After withdraw, record:

- tx hash
- AETH received by owner
- remaining AETH and ETH on the presale

### 5. Invalid presale is out of scope for this close

`0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` was recorded as invalid because `token()` did not match canonical V1. Inspect it with the existing `inspect-invalid-presale-recovery.mjs` / `cancel-invalid-base-presale.mjs` scripts as a **separate** ticket. Do not send its tokens into V2.

## Frontend / public copy gates

Must be true after this close-out:

- `purchaseAuthorized: false`
- No “presale live”, no raise progress bar, no `$4.25M` / `85% filled` style figures
- Published numbers match last verified `weiRaised` / `softCap` or say “sale ended, soft cap missed, refunds available”
- Link BaseScan Write Contract → `claimRefund`
- `presale-base.json` still describes historical deploy evidence; do not flip it back to `frontend.status: live` for purchases

## Cast / BaseScan cheat sheet

Read:

```bash
cast call 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "refundsAvailable()(bool)" --rpc-url $BASE_RPC
cast call 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "finalized()(bool)" --rpc-url $BASE_RPC
cast call 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "cancelled()(bool)" --rpc-url $BASE_RPC
cast call 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "weiRaised()(uint256)" --rpc-url $BASE_RPC
cast call 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "tokensReserved()(uint256)" --rpc-url $BASE_RPC
cast call 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "contributions(address)(uint256)" 0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2 --rpc-url $BASE_RPC
cast balance 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d --rpc-url $BASE_RPC
```

Owner writes (only after pre-check):

```bash
# optional
cast send 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "cancel()" --rpc-url $BASE_RPC --private-key $OWNER_KEY

# owner smoke refund
cast send 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "claimRefund()" --rpc-url $BASE_RPC --private-key $OWNER_KEY

# only after reserved inventory is reconciled
cast send 0xe0A3B6368312dFd3E7E76202e673f895f8235A3d "withdrawUnsoldTokens()" --rpc-url $BASE_RPC --private-key $OWNER_KEY
```

Same functions are available on BaseScan → Contract → Write as Contract, connected as owner.

## Done when

- This decision is in `PROJECT_STATUS.md` (done 2026-09-19).
- Live read confirms `refundsAvailable == true` and `finalized == false`.
- Public pages no longer offer purchase.
- Owner smoke contribution is refunded or explicitly recorded as unclaimed.
- Remaining unsold AETH is either still inventoried on the presale or withdrawn to owner with a recorded tx.
- No V2 transaction exists as part of this close-out.

## Explicitly not done by this document

- Approving the 950M / 50M V2 ledger
- Deploying V2 or the permanent lock
- Opening a replacement presale
- Creating liquidity
- Changing Emvori or Sentinel L3
