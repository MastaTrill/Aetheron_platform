# Aetheron isolated API deployment plan — 2026-10-14

**Status:** configuration only; no hosted API created, DNS changed, or production traffic switched.

## Build and start

- Source: `MastaTrill/Aetheron_platform`, isolated audit branch `audit/release-truth-2026-10-14` until accepted.
- Runtime: Node.js 22; working directory `backend`.
- Install: `npm ci --omit=dev`.
- Start: `npm run start:api` (runs `node standalone-api.mjs`). **Do not use** default `npm start`, which starts the separate legacy dashboard server.
- Set host-assigned `PORT` to a valid integer, otherwise default 4000. Health check: `GET /health` should return service `aetheron-backend-api`, chainId `8453` and status `ok`.
- No signing keys, wallet seed phrases, Coinbase secrets or real funds in an acceptance environment. Keep `AETHERON_SIGNER_ROUTES_ENABLED` unset/false.
- If preview frontend origins are needed, set `ALLOWED_ORIGINS` to exact HTTPS origin(s), comma separated; avoid wildcard CORS.
- Leave payment history disabled (authenticated request returns 503 `PAYMENT_HISTORY_NOT_CONFIGURED`) until user-scoped auth and storage exist.

## Read-only acceptance before connecting Cloudflare

1. Verify TLS and `GET /health` over the deployed preview URL; confirm chainId 8453 and service identifier.
2. Test `Origin` headers: approved origin reflected with `Vary: Origin`, unknown origin not allowed. Check `OPTIONS` and security headers.
3. Confirm unauthenticated `POST /launch-token`, `POST /nft/mint`, `POST /nft/list`, `POST /nft/buy` return 401; authorized operator with signing disabled returns 503.
4. Confirm payment history requires operator authorization and, when authorized, returns 503 `PAYMENT_HISTORY_NOT_CONFIGURED`.
5. Confirm invalid Coinbase webhook signature rejected; do not submit real charges or sign transactions.
6. Confirm a nonexistent API route returns JSON 404, not the frontend HTML.
7. Test static Cloudflare Worker separately for HTML, assets, cache and wallet display; **do not** alter apex or `www` DNS until rollback and acceptance evidence are recorded.

## Explicit blockers

- No verified Cloudflare custom-domain binding, active origin inventory, backend service, preview URL, or hosted acceptance results.
- Do not reuse the Render service labeled “Aetheron Platform 2026”: it currently points to the unrelated JarvisAI repository.
- Service creation, secrets and any paid plan require a separate reviewed decision; this document does not authorize deployment or merging PR #260.
