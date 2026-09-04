# Aetheron Production Readiness Evidence

This record is the release gate for **public** Base presale / trading / liquidity.
A green CI run alone is not authorization to launch or move public funds.

**Current product gate:** issue **#219** + `presale-config.js` → `launchAuthorized: false`.

Sepolia is **not** required (see `docs/evidence/ISSUE_217_PATH_EVIDENCE_SUBSTITUTION_2026-09-04.md`).

## Published Base configuration

- Network: Base Mainnet (`8453`)
- AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
- Verified owner: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Verified treasury: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Deployment record: `smart-contract/deployments/presale-base.json`
- Authorization worksheet: `docs/evidence/ISSUE_219_AUTHORIZATION_WORKSHEET_2026-09-04.md`

The frontend must fail closed if deployed bytecode is missing, token linkage is wrong, or owner/treasury do not match the verified deployment record. Public purchases stay blocked while `launchAuthorized` is false.

## Required evidence before public onboarding

- [x] Canonical AETH + presale addresses recorded and BaseScan-verified (deployment JSONs).
- [x] Owner smoke purchase recorded on Base.
- [x] Offline production suite green (74/74 as of 2026-09-04).
- [x] Frontend publishes `launchAuthorized: false` until #219 approval.
- [ ] Independent reviewer named + sign-off for exact commit.
- [ ] Owner/treasury separation decision (accept EOA or remediate).
- [ ] Terms, risk, jurisdiction, incident response, support channel approved.
- [ ] Liquidity plan either fully specified or explicitly deferred.
- [ ] Owner posts `approved` on #219 with pinned commit SHA.
- [ ] Only then set `launchAuthorized: true` in a dedicated commit.
- [ ] Optional: wallet matrix (MetaMask / Coinbase desktop + mobile) after auth.
- [ ] Optional: low-value public canary only after auth.

## Evidence table

| Check | Value / link | Timestamp (UTC) | Reviewer |
|---|---|---|---|
| Deployed commit (candidate) | `417e2dbde2aae254f81813c0d62e254668d9ccea` | 2026-09-04 | _pending_ |
| AETH | `0xecf7…8E4e` | recorded | BaseScan |
| Presale | `0xe0A3…5A3d` | recorded | BaseScan |
| Smoke purchase | `0xd16f…5728` | 2026-07-18 | owner |
| Offline suite | 74/74 | 2026-09-04 | sandbox |
| Public launch decision | **not approved** | — | — |

## Decision

- **NO-GO** while #219 is open or any owner-required field on the worksheet is blank.
- **GO** only after #219 records `approved` for the exact commit and addresses, then `launchAuthorized: true` is committed deliberately.
