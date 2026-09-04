# Aetheron Platform Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove public server-signing/data exposure, align deployed artifacts with tested artifacts, and prepare a single Base-only V2 release path without broadcasting mainnet transactions.

**Architecture:** A fail-closed operator boundary protects all privileged API operations; Vercel publishes only the curated `dist` bundle; canonical state separates observed chain facts from release authorization; unsafe legacy contracts/workflows are explicitly quarantined. V2 remains gated behind migration, rehearsal, audit, and written authorization.

**Tech Stack:** Node.js 22, Express 5, Jest/Supertest, Hardhat 3, ethers 6, Solidity 0.8.20, Vercel, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-03-platform-hardening-design.md`

## Global Constraints

- No mainnet state-changing transaction.
- No public-fund acceptance or liquidity/trading enablement.
- Privileged API behavior must fail closed when secrets/feature flags are missing.
- Coinbase webhook verification must use raw request bytes.
- Vercel must serve the same `dist` artifact tested by CI.
- V1 is not a liquidity candidate; V2 is not deployable until migration/release gates are complete.

---
### Task 1: Privileged API boundary and signer kill switch

**Files:**
- Create: `backend/security.mjs`
- Modify: `backend/api-app.mjs`, `backend/scanner/launchpad-api.mjs`, `backend/scanner/nft-api.mjs`
- Test: `backend/server.test.js`

**Interfaces:** `requireOperator(req,res,next)` validates `Authorization: Bearer`; `requireSignerEnabled(req,res,next)` requires `AETHERON_SIGNER_ROUTES_ENABLED=true`.

- [ ] Add failing Supertest cases proving `/launch-token`, `/nft/mint`, `/nft/list`, and `/nft/buy` reject unauthenticated callers before signer construction.
- [ ] Run `npm --prefix backend test -- --runInBand`; verify the new tests fail.
- [ ] Implement constant-time bearer validation with no fallback key and a signer feature gate.
- [ ] Mount the middleware on all server-signing routes.
- [ ] Re-run backend tests; verify green.
- [ ] Commit `fix: fail closed on server signing routes`.

### Task 2: Payment authorization and verified webhook

**Files:** `backend/scanner/coinbase-commerce.mjs`, `payment-history-backend.mjs`, `all-payments-backend.mjs`, `backend/api-app.mjs`, `backend/server.test.js`.

- [ ] Add failing tests for operator-only payment history/all-payments and forged/missing Coinbase webhook signatures.
- [ ] Verify RED with the backend Jest suite.
- [ ] Preserve raw webhook bytes before JSON parsing and verify legacy `X-CC-Webhook-Signature` HMAC-SHA256 with `COINBASE_COMMERCE_WEBHOOK_SECRET`.
- [ ] Protect payment-history and all-payments with `requireOperator` until user sessions exist.
- [ ] Verify GREEN and commit `fix: authenticate payment data and webhooks`.
### Task 3: Deploy exactly the artifact CI validates

**Files:** `vercel.json`, `production-bundle-base.test.mjs`, `package.json` if needed.

- [ ] Add a failing regression assertion that Vercel must run `npm run build` and publish `dist`.
- [ ] Verify RED with `node production-bundle-base.test.mjs` or the focused config test.
- [ ] Change Vercel build/output settings to the curated production artifact.
- [ ] Build and scan `dist`; verify no legacy chain markers are present.
- [ ] Run the full root `npm test` suite and commit `fix: deploy curated production bundle`.

### Task 4: Remove legacy execution paths from active production architecture

**Files:** `build-cloudflare-dist.cjs`, active onboarding/navigation files, legacy deployment workflow(s), production safety tests.

- [ ] Add/extend tests to ensure Polygon chain IDs, old AETH address, QuickSwap links, smart-routing execution pages, and obsolete deployment workflows cannot become production entrypoints.
- [ ] Verify the tests detect the legacy surfaces.
- [ ] Keep historical files archived/excluded; remove active navigation to them and disable obsolete deployment workflow execution.
- [ ] Rebuild `dist` and run root safety tests.
- [ ] Commit `chore: quarantine legacy chain execution paths`.
### Task 5: Canonical chain-state semantics

**Files:** `smart-contract/deployments/aeth-base.json`, `PROJECT_STATUS.md`, canonical-deployment tests/scripts.

- [ ] Add a failing test requiring observed on-chain state and public release authorization to be separate fields.
- [ ] Update the manifest to represent `tradingEnabled=true` as observed state while keeping public market authorization false.
- [ ] Ensure UI/release checks consume the release gate rather than inferring launch status from the V1 boolean.
- [ ] Run canonical-deployment and root tests; commit `fix: separate chain state from release authorization`.

### Task 6: Deterministic clean-checkout contract tests and dependency audit

**Files:** `smart-contract/package.json`, lockfiles/security docs as required.

- [ ] Add a focused failing check demonstrating `npm test` lacks compile-before-test/deterministic concurrency.
- [ ] Change the contract test command to compile first and run Node tests with concurrency 1.
- [ ] Run the full 60-test suite from a clean artifacts state.
- [ ] Run root/backend/contract `npm audit --omit=dev --audit-level=high`; update only safe dependency/lockfile versions needed to remove high-severity production findings.
- [ ] Update `SECURITY.md` to report a timestamped verified result rather than a permanent zero-vulnerability claim.
- [ ] Commit `test: make contract verification deterministic` and dependency fixes separately.
### Task 7: Quarantine unsafe production contract modules

**Files:** deployment scripts/docs/tests referencing `AetheronGovernance.sol` or custom multisig; release documentation.

- [ ] Add regression checks that production Base deployment commands cannot deploy governance, Vendor, or custom treasury modules without an explicit future approval path.
- [ ] Move/mark obsolete deployment instructions as historical and remove production-ready claims.
- [ ] Preserve source for later redesign; do not deploy or silently rewrite economics/custody behavior in this campaign.
- [ ] Run contract and operational safety tests; commit `chore: quarantine unapproved contract modules`.

### Task 8: Integrate V2 safely and define migration gate

**Files:** merge/cherry-pick the reviewed PR #238 V2 changes, plus migration/release docs/tests as needed.

- [ ] Rebase or merge V2 onto the hardened branch without changing deployed V1 state.
- [ ] Add migration invariants: V1 and V2 supplies cannot both be presented as one canonical live supply; exact balance reconciliation and canonical-address switch require written release authorization.
- [ ] Keep AMM/liquidity, presale, staking, and trading operations disabled pending #217/#219 requirements.
- [ ] Run root, backend, contract, production simulation, canonical truth, Slither/Forge-equivalent local checks available, and GitHub CI.
- [ ] Open a PR with the hardening evidence; do not merge until required checks are green.

## Final verification

- [ ] `npm test`
- [ ] `npm --prefix backend test -- --runInBand`
- [ ] `npm --prefix smart-contract test`
- [ ] Production dependency audits report no high-severity findings in active packages.
- [ ] `git diff --check` is clean and only intended files changed.
- [ ] GitHub Actions required checks pass on the PR head.