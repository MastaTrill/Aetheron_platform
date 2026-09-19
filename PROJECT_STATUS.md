# Aetheron Platform - Canonical Project Status

**Status:** Active flagship - Base V1 presale closed as missed soft cap; refunds are the canonical contributor path; V2 remains prepared and unapproved; liquidity deferred
**Last updated:** 2026-09-19

## Decision (2026-09-19)

Base presale missed soft cap. We will **not finalize**. We will **not** treat this deployment as an open or reusable sale. Contributors recover ETH by calling `claimRefund()`. V2 stays `prepared_unapproved` and is not deployed from this close-out.

Written authorization:

> Base presale missed soft cap. We will enable / keep refunds, will not finalize, will not deploy V2 until the migration ledger is separately approved, and public pages will match on-chain state.

## Production truth

- Canonical network: **Base Mainnet** (`8453`).
- Canonical AETH V1: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Current Base presale (do not reuse): `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- Invalid superseded Base presale (separate recovery surface): `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`.
- Issue #219 remains approved and `launchAuthorized: true` records that historical approval only.
- Public purchase execution remains fail-closed: `purchaseAuthorized: false`.
- Deployed sale window ended **2026-08-01 20:06:40 UTC** (`endTime` 1785614800).
- Read-only Base verification on 2026-09-05 confirmed `saleLive: false`, `weiRaised: 0.0049 ETH`, `tokensReserved: 4,900 AETH`, `softCap: 5 ETH`, `refundsAvailable: true`, `finalized: false`, and `cancelled: false`.
- Soft cap was **5 ETH**. Raised amount is far below cap, so `finalize()` is required to revert (`Softcap not met - cancel and refund instead`).
- `refundsAvailable()` is already true from schedule + missed cap. Owner `cancel()` is optional documentation, not a prerequisite for refunds.
- Owner **cannot** `withdrawFunds()` unless the sale is finalized. Do not attempt to take contributor ETH.
- The current presale cannot be safely reused: `updateSchedule` is locked after start and requires `weiRaised == 0`.
- Product `tradingAuthorized: true`; on-chain V1 `tradingEnabled: true` was observed on 2026-09-03. That flag is one-way. It does **not** authorize a pool.
- `liquidityAuthorized: false`; no canonical Base pool is configured and no V1 liquidity should be created.
- Owner / treasury records currently point to `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
- AETH V2 remains `prepared_not_deployed`. The prepared V1 -> V2 ledger remains `prepared_unapproved`.

Close-out runbook: `docs/PRESALE_CLOSEOUT.md`.

## Closed

- #214 Base cleanup.
- #217 path-evidence gate.
- #219 public launch authorization (historical; does not reopen purchases).
- Product trading authorization aligned with live V1 chain state.
- Frontend purchase gate split from launch approval so an expired sale cannot be marketed or executed as open.
- V2 transfer-tax / AMM-specific token logic removed from the forward candidate so post-launch transfers use standard ERC20 semantics.
- Prepared an exact reviewable V1 -> V2 migration ledger and a no-recovery permanent supply-lock contract; execution gates remain false.
- **2026-09-19:** Canonical decision recorded that this Base presale is a missed-soft-cap refund close, not a finalize and not a V2 cutover.

## Open hardening / launch follow-up

- [x] Preserve the current expired presale for contributor refund/claim handling; do not repurpose its balances.
- [ ] Re-read live Base state (`weiRaised`, `tokensReserved`, `finalized`, `cancelled`, `refundsAvailable`, ETH balance, AETH balance) immediately before any owner call.
- [ ] Optional owner `cancel()` on `0xe0A3B6…235A3d` for an explicit `Cancelled` event. Not required for refunds.
- [ ] Publish contributor instructions: call `claimRefund()` from the same wallet that bought. Owner cannot pull their ETH for them.
- [ ] After reserved inventory is reconciled (refunds claimed or reserved == 0), owner may `withdrawUnsoldTokens()` of inventory that is **not** `tokensReserved`.
- [ ] Keep `purchaseAuthorized: false` on every public frontend and status page.
- [ ] Align public copy (GitHub Pages / marketing) with missed-cap + refunds. Do not show an active raise.
- [ ] Inspect the invalid presale `0xA7aa36…b07C` as a separate recovery item. Do not mix its balances into this close-out.
- [ ] Re-verify and resolve the replacement-presale V1 recovery dependency before any V2 cutover.
- [ ] Capture a fresh V1 balance snapshot immediately before migration execution and reconcile it against the prepared ledger.
- [ ] Independently review and approve the prepared V1 -> V2 migration ledger.
- [ ] Complete independent review of the revised standard-ERC20 V2 candidate and permanent supply-lock contract.
- [ ] Deploy and source/runtime-verify the permanent supply lock without funding it; the irreversible 50M transfer requires separate explicit approval.
- [ ] Deploy V2 only through the gated Base deployment entrypoint and verify source/runtime/supply evidence while any new launch token trading remains disabled.
- [ ] Verify exactly 50M V2 AETH is permanently locked and exactly 950M V2 AETH remains accessible before cutover.
- [ ] Approve explicit replacement presale start/end terms only after this close-out is complete; then deploy a **new** Base presale. Never reuse `0xe0A3B6…235A3d`.
- [ ] Choose, authorize, create, and publicly record canonical Base liquidity only for the verified launch token after opening-price and liquidity-size review.
- [ ] Improve owner / treasury separation with reviewed multisig controls if adopted.
- [ ] Keep AETH V2 migration/canonical-cutover gates fail-closed until deployment, source/runtime verification, supply reconciliation, balance-plan approval, permanent-lock verification, and explicit cutover approval are complete.

## Production safety rules

1. `launchAuthorized: true` records owner approval; it does not prove an active sale window.
2. `purchaseAuthorized` and live on-chain schedule checks must both be true before the frontend can enable purchases.
3. Do not call `enableTrading()` again on V1; the V1 flag is one-way and already true.
4. `tradingEnabled` does not prove a liquid public market exists.
5. Do not create canonical V1 liquidity; V2 is the forward launch candidate and uses standard ERC20 transfer semantics.
6. Do not send V2 tokens to either legacy presale contract; their token linkage is not a V2 migration destination.
7. The 50M V2 permanent-lock transfer is intentionally irreversible and must never be bundled into an unreviewed deployment action.
8. Liquidity authorization is separate from trading authorization and requires public transaction/pool evidence.
9. Do not attempt to reschedule the current presale; its verified schedule mutator is locked after sale start / contributions.
10. V1 remains canonical until the V2 migration manifest records verified deployment evidence and a separate cutover authorization.
11. Custom `AetheronGovernance`, `AetheronMultiSigTreasury`, and `AetheronVendor` are retained only as experimental/test surfaces and are not production-authorized deployment paths.
12. Production contract records belong in `smart-contract/deployments/`, and public configuration must consume canonical Base deployment truth.
13. Do not call `finalize()` on the current Base presale. Soft cap was missed; the function is specified to revert.
14. Do not call `withdrawFunds()` on the current Base presale. It requires `finalized`.
15. Contributor ETH leaves only through `claimRefund()` paid to `msg.sender`.

## Scope boundary

Sentinel L3 remains maintained in `MastaTrill/Aetheron-Sentinel-L3`. Emvori and general-purpose AI work are outside this platform release scope.
