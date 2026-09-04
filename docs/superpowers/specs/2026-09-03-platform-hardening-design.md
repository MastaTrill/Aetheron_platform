# Aetheron Platform Hardening Design

## Goal

Move Aetheron from a mixed prototype/production repository to a fail-closed Base-only release architecture without performing any mainnet state-changing transaction.

## Scope and ordering

1. Protect every server-side signing and privileged data route.
2. Make Vercel serve the same curated `dist` artifact that CI validates.
3. Verify payment webhooks and protect payment history/admin data.
4. Prevent legacy Polygon execution surfaces from reaching production.
5. Separate immutable deployment facts, mutable on-chain state, and release authorization.
6. Make contract tests deterministic from a clean checkout.
7. Quarantine unsafe governance/custom-treasury modules from production release paths.
8. Integrate the tax-safe AETH V2 work and define migration/release gates without deploying it.

## Security boundary

The public web app may perform read-only Base calls and may expose explicitly public informational endpoints. No unauthenticated HTTP request may cause the server to sign or broadcast a blockchain transaction, expose all-user payment data, or mutate privileged platform state.
## Privileged API design

Create one ESM security module for the Vercel/backend API. Privileged routes require both:

- `AETHERON_OPERATOR_API_KEY` configured to a non-placeholder secret; and
- `Authorization: Bearer <key>` matching in constant time.

Server-side signer routes additionally require `AETHERON_SIGNER_ROUTES_ENABLED=true`. When either requirement is absent, they fail closed before wallet construction or RPC submission. There is no development fallback secret.

Protected signer operations include token launch, NFT mint/list/buy, and any future route that constructs a wallet from `DEPLOYER_PRIVATE_KEY`. Payment-history and all-payments routes are operator-only until real user sessions exist, eliminating the current caller-selected user-ID exposure.

## Payment webhook design

The existing Coinbase Commerce integration uses the legacy Commerce charge API. Preserve raw request bytes for `/coinbase-webhook`, verify `X-CC-Webhook-Signature` using HMAC-SHA256 and `COINBASE_COMMERCE_WEBHOOK_SECRET`, compare signatures in constant time, then parse JSON. Missing secrets or bad signatures fail closed.
## Deployment artifact design

Root Vercel builds run `npm run build` and publish `dist`, never repository root. The `dist` builder remains the allow/deny boundary for static production files. Regression tests must validate both the bundle and Vercel configuration so deployment cannot silently diverge from CI again.

Legacy Polygon/Mumbai/Solana execution pages and scripts remain in source only if needed for history, but production-bundle tests prohibit their chain IDs, addresses, routers, and swap links from `dist`. Operational deployment workflows must be Base-only or explicitly archived/disabled.

## Canonical deployment truth

`smart-contract/deployments/aeth-base.json` must not use a mutable field as if it were immutable deployment metadata. Record the observed on-chain value separately from release authorization, for example `onChainState.tradingEnabled: true` and `release.publicMarketAuthorized: false`, with a timestamp/source note. Public UI remains governed by the release gate, not by the one-way V1 boolean alone.

## Contract/test posture

No V1 liquidity is authorized. AETH V2 is the forward token candidate. V2 migration must explicitly account for the existing V1 1B supply, owner/treasury/presale balances, and the identity of the canonical token before any deployment or liquidity action.
Fresh contract verification must run `hardhat compile` before tests and use deterministic test concurrency so a clean Windows checkout does not fail from missing artifacts or Hardhat worker OOM. Existing CI compile/test/Slither/Forge checks remain required.

`AetheronGovernance.sol` and `AetheronMultiSigTreasury.sol` are not approved production components. Governance is quarantined because cancellation/deposit and voting/delegation semantics require redesign. The custom upgradeable treasury is quarantined in favor of a battle-tested external multisig/timelock for production custody.

## Release constraints

- No mainnet deployment, signing, liquidity addition, public-fund acceptance, or trading action in this hardening campaign.
- Issues #217 and #219 remain release gates.
- V1 remains a historical deployed contract; do not imply that `tradingEnabled=true` means a live approved market.
- Every behavior change is introduced by a failing regression test first.
- Root, backend, contract, production-bundle, dependency-audit, and GitHub Actions checks must pass before merge.

## Success criteria

A fresh checkout can build and test deterministically; production serves only the curated Base-safe artifact; unauthenticated callers cannot reach server-side signing or privileged payment data; Coinbase webhooks are authenticated from raw bytes; canonical metadata distinguishes chain state from release authorization; and V2 work can proceed through rehearsal/audit without ambiguity from legacy execution paths.