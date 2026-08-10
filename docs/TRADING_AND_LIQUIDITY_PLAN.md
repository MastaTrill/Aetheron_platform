# Aetheron (AETH) — Trading & Liquidity Enablement Plan

**Status:** DRAFT — not authorized for execution  
**Last updated:** 2026-08-09  
**Network:** Base Mainnet (canonical)  
**Token:** `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`  
**Current trading status:** Disabled in canonical manifest

---

## 1. Preconditions (all required)

This plan must **not** be executed until every item below is complete:

- [ ] Base Sepolia presale + staking rehearsal closed with full evidence packet (#217)
- [ ] Owner / treasury / multisig / timelock separation reviewed and documented
- [ ] Independent smart-contract review accepted (or formal waiver recorded)
- [ ] Final Base Mainnet launch authorization granted (#219)
- [ ] Evidence templates filled and linked from the relevant issues
- [ ] Explicit written decision to enable trading recorded in this file + PROJECT_STATUS.md

Testnet rehearsal does **not** authorize mainnet trading or liquidity actions.

---

## 2. Objectives

1. Enable controlled, transparent trading of AETH on Base Mainnet.
2. Seed initial liquidity in a way that is recoverable / governed (multisig / timelock where applicable).
3. Avoid premature listings or marketing claims before liquidity and trading are live and verified.
4. Keep the canonical registry and frontend configuration in sync with on-chain reality.

---

## 3. Recommended Sequence (after authorization)

### Phase A — Pre-enable checklist
- Confirm token ownership and any pause / trading-enable function (if present).
- Confirm treasury and liquidity wallet addresses are correct and controlled.
- Snapshot current balances and ownership state (RPC + explorer).
- Update `PROJECT_STATUS.md` and deployment registry to reflect “authorization granted, enablement in progress”.

### Phase B — Liquidity seeding
- Choose primary venue (recommended starting point: Uniswap v3 on Base, or the canonical DEX preferred by the team).
- Decide initial pair (e.g. AETH/WETH or AETH/USDC), fee tier, and price range if concentrated liquidity.
- Decide initial size (ETH/USDC side + AETH side) and record the exact amounts.
- Deploy / add liquidity via the controlled wallet (prefer multisig).
- Record:
  - Pool address
  - LP NFT / position ID (if v3)
  - Transaction hashes
  - Initial price and amounts

### Phase C — Trading enablement
- If the token has an explicit trading-enable or unpause function, execute it only after liquidity is live.
- Verify that swaps work in both directions with small test amounts.
- Confirm tax / fee logic (if any) behaves as designed on buy and sell.
- Update canonical manifest: set trading status from `disabled` → `enabled` with the enabling tx hash.

### Phase D — Post-enable validation
- Small buy + small sell smoke tests from a non-treasury wallet.
- Confirm BaseScan token page and any frontend price feeds update correctly.
- Only after this: consider DexScreener / aggregator visibility and later CoinGecko/CMC applications.

### Phase E — Listings (optional, later)
- DexScreener usually picks up automatically once there is volume.
- CoinGecko / CoinMarketCap: apply only after sustained liquidity and clean contract verification.
- Do not market “listed on CMC/CG” until the listing is actually live.

---

## 4. Risk Controls

- Prefer multisig for liquidity and treasury moves.
- Avoid single-key control of the majority of LP or circulating supply where avoidable.
- Document any trading taxes, max wallet, or anti-bot settings before enablement.
- Keep a clear rollback narrative: what happens if a critical bug is found after enablement (pause function? LP removal? communication plan?).
- Do not seed liquidity from an address that cannot be proven controlled by the project.

---

## 5. Decision Log

| Date | Decision | Authorized by | Notes |
|------|----------|---------------|-------|
| 2026-08-09 | Plan drafted; trading remains disabled | — | Gates #217 / #219 still open |
| | | | |

---

## 6. Explicit Non-Authorization

Until #219 is closed and this document is updated with an enablement decision:

- Do **not** enable trading on mainnet.
- Do **not** add public liquidity.
- Do **not** claim the token is tradeable or listed.
- Do **not** point the public frontend at a live swap UI as if trading were live.

---

## Related

- `PROJECT_STATUS.md`
- Issues #217, #219
- Evidence templates under `docs/evidence/`
- Master checklist: Aetheron-Sentinel-L3#263 (cross-project tracking)
