# Aetheron Platform - Canonical Project Status

**Status:** Active flagship - launch approval recorded; presale purchases paused; refunds available; trading flag on; liquidity deferred
**Last updated:** 2026-09-05

## Production truth

- Canonical network: **Base Mainnet** (`8453`).
- Canonical AETH V1: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Current Base presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- Issue #219 remains approved and `launchAuthorized: true` records that approval.
- Public purchase execution is separately fail-closed with `purchaseAuthorized: false` because the deployed sale window ended on **2026-08-01 20:06:40 UTC**.
- Read-only Base verification on 2026-09-05 confirmed `saleLive: false`, `weiRaised: 0.0049 ETH`, `tokensReserved: 4,900 AETH`, `softCap: 5 ETH`, `refundsAvailable: true`, `finalized: false`, and `cancelled: false`.
- The current presale cannot be safely reused for a new window: the verified `updateSchedule` path is restricted to before sale start and requires `weiRaised == 0`, while this deployment has already received contributions. A replacement presale is required for any new sale window.
- Product `tradingAuthorized: true`; on-chain V1 `tradingEnabled: true` was observed on 2026-09-03 and remains true.
- `liquidityAuthorized: false`; no canonical Base pool is configured and no V1 liquidity should be created.
- Owner / treasury records currently point to `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
- AETH V2 remains `prepared_not_deployed`; the forward V2 candidate uses standard ERC20 transfers with `transferTaxBps: 0` and `transferTaxPolicy: "none"`. V1 stays canonical until a separately verified V2 cutover.

## Closed

- #214 Base cleanup.
- #217 path-evidence gate.
- #219 public launch authorization.
- Product trading authorization aligned with live V1 chain state.
- Frontend purchase gate split from launch approval so an expired sale cannot be marketed or executed as open.
- V2 transfer-tax / AMM-specific token logic removed from the forward candidate so post-launch transfers use standard ERC20 semantics.

## Open hardening / launch follow-up

- [ ] Preserve the current expired presale for contributor refund/claim handling; do not repurpose its balances.
- [ ] Approve explicit replacement presale start/end terms, then deploy a new Base presale, fund it, source-verify it, smoke-test it, and record the new canonical address before setting `purchaseAuthorized: true`.
- [ ] Complete independent review of the revised standard-ERC20 V2 candidate.
- [ ] Deploy V2 only through the gated Base deployment entrypoint and verify source/runtime/supply evidence while trading remains disabled.
- [ ] Reconcile the V1 holder/balance snapshot into an approved V2 migration plan before canonical cutover.
- [ ] Choose, authorize, create, and publicly record canonical Base liquidity only for the verified launch token after opening-price and liquidity-size review.
- [ ] Improve owner / treasury separation with reviewed multisig controls if adopted.
- [ ] Keep AETH V2 migration/canonical-cutover gates fail-closed until deployment, source/runtime verification, supply reconciliation, balance-plan approval, and explicit cutover approval are complete.

## Production safety rules

1. `launchAuthorized: true` records owner approval; it does not prove an active sale window.
2. `purchaseAuthorized` and live on-chain schedule checks must both be true before the frontend can enable purchases.
3. Do not call `enableTrading()` again on V1; the V1 flag is one-way and already true.
4. `tradingEnabled` does not prove a liquid public market exists.
5. Do not create canonical V1 liquidity; V2 is the forward launch candidate and uses standard ERC20 transfer semantics.
6. Liquidity authorization is separate from trading authorization and requires public transaction/pool evidence.
7. Do not attempt to reschedule the current presale; its verified schedule mutator is locked after sale start / contributions.
8. V1 remains canonical until the V2 migration manifest records verified deployment evidence and a separate cutover authorization.
9. Custom `AetheronGovernance`, `AetheronMultiSigTreasury`, and `AetheronVendor` are retained only as experimental/test surfaces and are not production-authorized deployment paths.
10. Production contract records belong in `smart-contract/deployments/`, and public configuration must consume canonical Base deployment truth.

## Scope boundary

Sentinel L3 remains maintained in `MastaTrill/Aetheron-Sentinel-L3`. Emvori and general-purpose AI work are outside this platform release scope.
