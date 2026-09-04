# Aetheron (AETH) — Trading & Liquidity Enablement Plan

**Status:** Trading flag **authorized** in product config; **liquidity still deferred**
**Last updated:** 2026-09-04
**Network:** Base Mainnet
**Token:** `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`

---

## Live on-chain truth

From `docs/LIVE_BASE_STATE_AUDIT_2026-09-03.md`:

- `tradingEnabled`: **true** (one-way; do **not** call `enableTrading()` again)
- `quickswapRouter` / `liquidityPool`: **not configured** (zero)
- No observed DEX secondary-market transfer history as of that audit

**Implication:** Token transfers are not blocked by the trading flag, but there is **no canonical pool**. A liquid public market requires adding and verifying liquidity.

---

## Decision log

| Date | Decision | Authorized by | Notes |
|------|----------|---------------|-------|
| 2026-08-09 | Plan drafted; trading treated as disabled in docs | — | Pre-#219 |
| 2026-09-03 | Live audit: on-chain `tradingEnabled=true` | read-only | No tx |
| 2026-09-04 | #219 public presale approved | owner | `launchAuthorized=true` |
| 2026-09-04 | Product `tradingAuthorized=true` | owner (“Enable trading”) | Aligns config with on-chain; **liquidity still false** |

---

## Still required for a real market

1. Choose venue (e.g. Uniswap v3 on Base), pair, fee tier, amounts.
2. Add liquidity from a controlled wallet; record pool address + tx hashes.
3. Optionally register pair on token if the contract expects router/pool configuration (see tax caveats in live audit).
4. Small buy/sell smoke from a non-treasury wallet.
5. Set `liquidityAuthorized: true` only after receipts are in `smart-contract/deployments/`.

## Explicit non-claims

- Do not market “listed” or “liquid” until a verified pool exists.
- Do not call `enableTrading()` again.
- Tax rates on the token are not proof of effective DEX tax economics (see live audit §4).
