# Cloudflare migration verification and safe cutover gates — 2026-10-14

Status: **NOT CUT OVER / NOT CERTIFIED**. This is evidence and a checklist, not deployment authorization.

## Confirmed observations

- Cloudflare account screenshot shows an `aetheron` Worker at `aetheron.williammccoy2012.workers.dev` and deployment `b9d08213` marked **Ready**. Ready indicates deployment status, not successful website or wallet acceptance.
- User-reported Cloudflare DNS: apex `@` A records include `185.199.108.153`, `185.199.109.153`, `185.199.111.153`, proxied; `www` CNAME targets `mastatrill.github.io`. These are GitHub Pages origin settings behind Cloudflare proxy; other DNS records were not exhaustively checked.
- Repository `wrangler.toml` configures Worker `aetheron`, build command `npm run build`, and assets directory `dist`. Cloudflare Pages dashboard configuration is independent and not authenticated/verified.
- Vercel account is suspended and old Vercel deployment checks are failing. Do not treat Vercel status as a Cloudflare health test.
- On the isolated audit branch, `payment-history.js` no longer defaults to the Vercel API. It fails closed with an unavailable message until a reachable backend is explicitly configured. The replacement backend remains undeployed/unverified.

## Latest isolated certification (commit `20c83f0`)

- GitHub confirms four successful workflows: Dashboard Source Safety, Payment History Routing Regression, Operational Safety Gates, and Aetheron Preview HTTP Acceptance.
- Enhanced dashboard no longer includes the stale Vercel API endpoint and fails closed until an API is explicitly configured; the regression test is included in Dashboard Source Safety.
- This does not certify Cloudflare Worker deployment, wallet acceptance, or production release.

## Isolated branch security milestone

- Commit `31c20c6` passed Dashboard Source Safety (including both dependency audits, backend behavior tests, dashboard Jest tests and production build), Payment History Routing Regression, and Operational Safety Gates. These are GitHub CI results, **not** live Cloudflare certification.
- Payment-history backend remains deliberately unavailable (HTTP 503 after operator authentication) pending user-scoped authentication and persistent storage. Do not advertise it as operational.

## Live public frontend observations (2026-10-14)

- Read-only HTTPS content fetch of `https://aetrs.com` succeeded and returned the Aetheron DeFi platform page. It shows the canonical AETH V1 Base address `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`, chain ID 8453, V2 not deployed, no canonical DEX pool, and staking as planning only. The site warns users not to send funds and reports purchases paused.
- `https://www.aetrs.com` redirected to `https://aetrs.com/` and served the same platform content.
- `https://aetheron.williammccoy2012.workers.dev` remained inaccessible to unauthenticated content inspection (`login_required`). This does not establish a broken Worker, but blocks Worker-specific acceptance.
- Live page content and redirects are confirmed, **not** HTTP security headers, asset loading, JavaScript execution, wallet connection, or deployed source identity. Public domain availability does not prove that the Cloudflare Worker serves the domain.
- The isolated Render API's dedicated GitHub hosted HTTP acceptance workflow and three other certification workflows passed on commit `c8b1b8d`; frontend integration remains unverified.

## Frontend configuration blocker discovered

- `dashboard-enhanced.html` on the audit branch still declares `meta[name="aetheron-api-base"]` as `https://vercel-node-app-1.vercel.app`, and its CSP `connect-src` explicitly allows that Vercel API. `dashboard-enhanced.js` prioritizes that meta URL when selecting the backend. This means the enhanced dashboard is **not migrated to the isolated Render API or Cloudflare**, even though the homepage and preview API are individually reachable.
- Do not replace the production dashboard URL with the certification Render preview without an intentional environment split, authentication design, and release verification. The correct follow-up is to remove the stale production dependency on an isolated branch and fail closed until a production API target is approved, then test the dashboard's API-unavailable state.

## Required checks before DNS or CI changes

1. Verify actual Worker URL serves the expected HTML, JS, CSS and security headers with HTTP checks, and compare content/version with GitHub `main`.
2. Confirm Cloudflare Worker settings: custom domains, routes, bindings, environment variables, secrets (names only), asset handling, deploy source and production branch. Identify whether a separate Pages project exists.
3. Verify the active GitHub Pages origin and apex/`www` DNS inventory, redirects, SSL, cache and actual responses. Preserve rollback records and current target.
4. Inventory all Vercel-specific API and frontend dependencies, including `payment-history.js`, `backend/api-app.mjs`, analytics, GitHub checks, and Sentinel L3's separate dashboard deployment. Choose and test replacements before removal.
5. Exercise read-only wallet connect, wrong-chain handling, token address display, blocked presale purchase, staking/claim safety, backend API CORS and error handling on an isolated preview. Never use real wallet secrets or sign transactions for acceptance.
6. Cut over only after confirmed custom-domain readiness, HTTP + wallet acceptance, rollback plan, and required CI checks. Make DNS changes separately and verify both apex and `www` after propagation.

## Guardrails

No changes to live DNS, deployment, contracts, presale, liquidity, or funds under this audit. No deletion of Vercel checks until their replacement tests pass. Do not claim Cloudflare Pages exists merely because the Worker exists.

## Updated isolated certification — commit 37ee69f (2026-10-14)

- GitHub reports **success** for all four PR workflows: Dashboard Source Safety, Payment History Routing Regression, Operational Safety Gates, and Aetheron Preview HTTP Acceptance.
- Backend lockfile resolves `ip-address` to **10.7.4**, replacing vulnerable 10.7.0. The live-preview workflow now includes `npm audit --omit=dev --audit-level=moderate` and passed.
- Live preview acceptance also verifies that unauthenticated payment-history requests with a caller-selected user fail closed.
- Enhanced dashboard includes accessible status announcements and bounded API requests, with source regression tests. Automated checks do **not** substitute for mobile assistive-technology or wallet acceptance.
- **Still blocked:** Cloudflare Worker-specific access, deployed source comparison, real-device wallet connect/wrong-chain behavior, and production cutover approval. Do not infer production readiness from these four green checks.
