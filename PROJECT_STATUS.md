# Aetheron Platform — Canonical Project Status

**Status:** Active flagship — public presale authorized; trading flag on; liquidity deferred
**Last updated:** 2026-09-04

## Production truth

- Canonical network: **Base Mainnet** (`8453`).
- Canonical AETH V1: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Corrected Base presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- `launchAuthorized: true` under closed issue #219.
- Product `tradingAuthorized: true`; on-chain `tradingEnabled: true` was observed on 2026-09-03.
- `liquidityAuthorized: false`; no canonical Base pool is configured.
- Owner / treasury records currently point to `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`.
- AETH V2 remains `prepared_not_deployed`; V1 stays canonical until a separately verified V2 cutover.
- The presale schedule may be expired on-chain; authorization must not be described as an active sale until the current contract window is verified.

## Closed

- #214 Base cleanup.
- #217 path-evidence gate.
- #219 public presale authorization.
- Product trading authorization aligned with live chain state.

## Open hardening / launch follow-up

- [ ] Verify the current presale schedule before marketing an “open sale”.
- [ ] Choose, authorize, create, and publicly record canonical Base liquidity.
- [ ] Complete independent contract review.
- [ ] Improve owner / treasury separation with reviewed multisig controls if adopted.
- [ ] Keep AETH V2 migration/canonical-cutover gates fail-closed until deployment, source/runtime verification, supply reconciliation, balance-plan approval, and explicit cutover approval are complete.

## Production safety rules

1. `tradingEnabled` does not prove a liquid public market exists.
2. Do not call `enableTrading()` again; the V1 flag is one-way and already true.
3. Liquidity authorization is separate from trading authorization and requires public transaction/pool evidence.
4. V1 remains canonical until the V2 migration manifest records verified deployment evidence and a separate cutover authorization.
5. Custom `AetheronGovernance`, `AetheronMultiSigTreasury`, and `AetheronVendor` are retained only as experimental/test surfaces and are not production-authorized deployment paths.
6. Production contract records belong in `smart-contract/deployments/`, and public configuration must consume canonical Base deployment truth.
7. Never infer production readiness from a deployment alone; deployment state, product authorization, liquidity state, and canonical-token state are separate facts.

## Scope boundary

Sentinel L3 remains maintained in `MastaTrill/Aetheron-Sentinel-L3`. Emvori and general-purpose AI work are outside this platform release scope.
