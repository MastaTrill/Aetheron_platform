# Issue #219 — Base Mainnet public-launch authorization worksheet

**Status:** `DRAFT — NOT APPROVED`  
**Date prepared:** 2026-09-04  
**Repo tip at preparation:** `417e2dbde2aae254f81813c0d62e254668d9ccea`  
**Decision field:** leave blank until owner records `approved` or `rejected`

> Filling this worksheet does **not** authorize public funds, trading, or liquidity.  
> Only an explicit `approved` decision on issue #219 with the fields below complete does.

---

## 1. Prerequisites (updated after #217 policy)

| Prerequisite | State |
|--------------|--------|
| Sepolia `verified-rehearsal` | **Waived** — #217 closed via mainnet + suite substitution (`docs/evidence/ISSUE_217_PATH_EVIDENCE_SUBSTITUTION_2026-09-04.md`) |
| Frontend Base-only / fail-closed | **Met** — `presale-config.js` chainId `8453`, `launchAuthorized: false` |
| Canonical deployment records | **Met** — `aeth-base.json`, `presale-base.json` |
| Offline path suite | **Met** — 74/74 (`docs/evidence/OFFLINE_TEST_RUN_2026-09-04.md`) |
| Independent smart-contract review | **OPEN** — no named reviewer sign-off in repo |
| Owner / treasury / multisig / timelock separation | **OPEN** — owner and treasury are the same EOA in records |
| Sentinel 57% beneficiary / buy-sell smoke | **OUT OF SCOPE for Platform #219** unless this launch includes Sentinel L3; track in `Aetheron-Sentinel-L3` |
| Terms, risk, jurisdiction, incident response, support | **OPEN** — not recorded as approved |

---

## 2. Written authorization fields

### Filled from canonical records

| Field | Value |
|-------|--------|
| Chain ID | `8453` (Base Mainnet) |
| AETH token | `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e` |
| AETH create tx | `0x53c1a82cd949b5ad01e0656934ba3903c7d6e202ab2f4606f321a7c152346829` |
| AETH tradingEnabled (on-chain record) | `false` |
| Presale (corrected) | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` |
| Presale deploy tx | `0x7ac118e87c317b8c8cad669fac7fd04788529181fac8b577ee182d01a4270326` |
| Invalid legacy presale (do not use) | `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` |
| Recorded owner | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| Recorded treasury | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` (**same as owner**) |
| Rate | `1000000` (per deployment record) |
| Soft cap (wei) | `5000000000000000000` (5 ETH) |
| Hard cap (wei) | `33333333000000000000` |
| Min contribution (wei) | `300000000000000` (0.0003 ETH) |
| Max contribution (wei) | `33333333000000000000` |
| Start / end (unix) | `1784405200` / `1785614800` |
| Funded inventory (token units) | `33333333000000000000000000` |
| Smoke purchase tx | `0xd16ffbfe89c9a72d9fec77bf72642092f1e2593868bb01ad872dc83bf2fa5728` |
| BaseScan presale | https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d#code |
| BaseScan AETH | https://basescan.org/address/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e#code |
| Candidate commit SHA (docs tip) | `417e2dbde2aae254f81813c0d62e254668d9ccea` |
| Frontend gate | `launchAuthorized: false` |

### Must be completed by owner before `approved`

| Field | Value |
|-------|--------|
| Exact approved commit SHA | _TBD — pin the deploy/frontend commit you mean_ |
| Multisig address (if any) | _TBD or `none — accept EOA risk`_ |
| Timelock address (if any) | _TBD or `none — accept EOA risk`_ |
| Staking contract address | _TBD if staking is in day-one launch_ |
| Trading-enable tx plan | _TBD — caller, calldata intent, preconditions_ |
| Liquidity venue / pair / amounts / fee / slippage / max gas | _TBD — or explicit `liquidity deferred`_ |
| Named independent reviewer + sign-off ref | _TBD_ |
| Terms / risk / jurisdiction / support channel | _TBD_ |
| Rollback / cancel / pause / incident plan | _TBD_ |
| UTC authorization timestamp | _TBD_ |
| UTC authorization expiration | _TBD_ |
| **Final decision** | _`approved` / `rejected` / `deferred`_ |

---

## 3. Recommended GO criteria (minimal)

Do **not** set `launchAuthorized: true` until all of:

1. This worksheet’s “Must be completed by owner” table is filled.  
2. Owner explicitly accepts **owner == treasury** EOA risk **or** moves treasury/control.  
3. Independent review note is linked (even a named external reviewer memo).  
4. Liquidity is either fully specified or explicitly deferred.  
5. Issue #219 comment from the owner account contains the word **`approved`** and the pinned commit SHA.  
6. Then — and only then — flip `presale-config.js` `launchAuthorized` to `true` in a dedicated commit.

## 4. Explicit non-authorization

As of this document: **`decision = not approved`**.  
Public funds, trading, and canonical liquidity remain **prohibited**.
