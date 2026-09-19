# Aetheron Platform - Canonical Project Status

**Status:** Active flagship - Base V1 presale closed as missed soft cap; owner ETH refunded; 4,900 AETH still on sale contract; V2 remains prepared and unapproved; liquidity deferred
**Last updated:** 2026-09-19

## Decision (2026-09-19)

Base presale missed soft cap. We will **not finalize**. We will **not** treat this deployment as an open or reusable sale. V2 stays `prepared_unapproved`.

## Production truth

- Canonical network: **Base Mainnet** (`8453`), live-read block **51514063** via `base.drpc.org` on 2026-09-19.
- Canonical AETH V1: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` (`tradingEnabled: true`).
- Current Base presale (do not reuse): `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- `finalized: false`, `cancelled: false`, `refundsAvailable: true`.
- Accounting `weiRaised: 0.0049 ETH`. Contract ETH balance: **0**.
- `tokensReserved: 0`. Contract still holds **4,900 AETH**.
- Owner `refunded: true`. Owner refund tx: `0xbf43f25810ade862720b50e34451ae3776d005ce9985103ca3a777c640f83cbf` (0.0049 ETH returned).
- Earlier `withdrawUnsoldTokens`: `0xc1aa3ba5f7ecbbdd02ec8e863bfa747c63c0800407c85afab4100e2a72acfacb`.
- All six presale transactions are from the owner EOA. No third-party buyers on this contract.
- `purchaseAuthorized: false`.
- `liquidityAuthorized: false`.
- Owner / treasury: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
- AETH V2 remains `prepared_not_deployed` / `prepared_unapproved`.

Evidence: `docs/LIVE_BASE_STATE_2026-09-19.md` and `docs/PRESALE_CLOSEOUT.md`.

## Closed

- #214, #217, #219 (historical launch approval only).
- Frontend purchase gate remains fail-closed.
- 2026-09-19 decision recorded: missed-cap refund close, not finalize, not V2 cutover.
- 2026-09-19 live pre-check completed.
- Owner smoke / owner contributions already refunded on-chain.

## Open hardening / launch follow-up

- [x] Preserve expired presale; do not reuse.
- [x] Live Base pre-check 2026-09-19.
- [ ] Optional owner `cancel()` for an explicit Cancelled event.
- [x] Owner `claimRefund()` already mined.
- [ ] Second `withdrawUnsoldTokens()` to pull remaining 4,900 AETH (requires owner wallet; this session cannot sign).
- [x] Keep `purchaseAuthorized: false`.
- [ ] Align Sentinel L3 public pages that still show fabricated raise figures (85% / $4.25M).
- [ ] Invalid presale `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` separate recovery.
- [ ] V2 ledger approval, lock, deploy, replacement presale, liquidity — all still fail-closed.

## Production safety rules

1. `launchAuthorized: true` is historical only.
2. Do not call `finalize()` or `withdrawFunds()`.
3. Do not call `enableTrading()` again.
4. Do not add V1 liquidity.
5. Do not reuse this presale schedule.
6. Do not deploy V2 from this close-out.
