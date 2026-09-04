# Base Sepolia rehearsal — not executed (2026-09-04)

This file is intentional evidence that the **#217** rehearsal has **not** been run by automated agents and is **not** complete.

## Why

Executing a protected Base Sepolia rehearsal requires:

1. Operator machine with funded Base Sepolia ETH
2. Controlled private key **not** in GitHub or CI
3. Deploy scripts run with explicit confirmation env vars
4. Full path matrix (buy/cancel/refund/claim/stake/unstake/privilege failures)
5. Immutable artifact package filled from `BASE_SEPOLIA_REHEARSAL_TEMPLATE.md`

None of those steps can be completed from a chat session without exposing signing keys.

## Repo state as of this note

- V1 AETH on Base Mainnet remains canonical (`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`).
- AETH V2 is **prepared_not_deployed** on `main` (merged PR #238); address remains `null` in `smart-contract/deployments/aeth-v2-migration.json`.
- Public `launchAuthorized: false`.
- Issues **#217** and **#219** remain open release gates.

## Operator next steps

1. On a trusted machine: `cd smart-contract && npm ci && npm test`
2. Configure Base Sepolia RPC + operator key offline.
3. Deploy rehearsal contracts; fill `docs/evidence/BASE_SEPOLIA_REHEARSAL_TEMPLATE.md` and the JSON template.
4. Commit only the evidence package (addresses, hashes, digests) — never keys.
5. Request independent review, then open #219 authorization fields.

**Status:** `rehearsal_not_executed`
