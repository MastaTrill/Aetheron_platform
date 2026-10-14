# Cloudflare migration verification and safe cutover gates — 2026-10-14

Status: **NOT CUT OVER / NOT CERTIFIED**. This is evidence and a checklist, not deployment authorization.

## Confirmed observations

- Cloudflare account screenshot shows an `aetheron` Worker at `aetheron.williammccoy2012.workers.dev` and deployment `b9d08213` marked **Ready**. Ready indicates deployment status, not successful website or wallet acceptance.
- User-reported Cloudflare DNS: apex `@` A records include `185.199.108.153`, `185.199.109.153`, `185.199.111.153`, proxied; `www` CNAME targets `mastatrill.github.io`. These are GitHub Pages origin settings behind Cloudflare proxy; other DNS records were not exhaustively checked.
- Repository `wrangler.toml` configures Worker `aetheron`, build command `npm run build`, and assets directory `dist`. Cloudflare Pages dashboard configuration is independent and not authenticated/verified.
- Vercel account is suspended and old Vercel deployment checks are failing. Do not treat Vercel status as a Cloudflare health test.
- `payment-history.js` still defaults to `https://vercel-node-app-1.vercel.app` for its API. Removing Vercel without replacing and testing this dependency could break functionality.

## Required checks before DNS or CI changes

1. Verify actual Worker URL serves the expected HTML, JS, CSS and security headers with HTTP checks, and compare content/version with GitHub `main`.
2. Confirm Cloudflare Worker settings: custom domains, routes, bindings, environment variables, secrets (names only), asset handling, deploy source and production branch. Identify whether a separate Pages project exists.
3. Verify the active GitHub Pages origin and apex/`www` DNS inventory, redirects, SSL, cache and actual responses. Preserve rollback records and current target.
4. Inventory all Vercel-specific API and frontend dependencies, including `payment-history.js`, `backend/api-app.mjs`, analytics, GitHub checks, and Sentinel L3's separate dashboard deployment. Choose and test replacements before removal.
5. Exercise read-only wallet connect, wrong-chain handling, token address display, blocked presale purchase, staking/claim safety, backend API CORS and error handling on an isolated preview. Never use real wallet secrets or sign transactions for acceptance.
6. Cut over only after confirmed custom-domain readiness, HTTP + wallet acceptance, rollback plan, and required CI checks. Make DNS changes separately and verify both apex and `www` after propagation.

## Guardrails

No changes to live DNS, deployment, contracts, presale, liquidity, or funds under this audit. No deletion of Vercel checks until their replacement tests pass. Do not claim Cloudflare Pages exists merely because the Worker exists.
