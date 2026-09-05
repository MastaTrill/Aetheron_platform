# Aetheron Production Readiness Evidence

This record is the release gate for **public** Base presale / trading / liquidity.
A green CI run alone is not authorization to launch or move public funds.

**Current product gate:** issue **#219** is approved (`launchAuthorized: true`), while the expired current sale is separately blocked with `purchaseAuthorized: false`.

Sepolia is **not** required (see `docs/evidence/ISSUE_217_PATH_EVIDENCE_SUBSTITUTION_2026-09-04.md`).

## Published Base configuration

- Network: Base Mainnet (`8453`)
- AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
- Verified owner: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Verified treasury: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Deployment record: `smart-contract/deployments/presale-base.json`
- Authorization worksheet: `docs/evidence/ISSUE_219_AUTHORIZATION_WORKSHEET_2026-09-04.md`

The frontend must fail closed if deployed bytecode is missing, token linkage is wrong, or owner/treasury do not match the verified deployment record. Public purchases stay blocked unless both owner launch approval and the explicit purchase gate are true, and the live Base schedule also reports an active sale window.

## Required evidence before public onboarding

- [x] Canonical AETH + presale addresses recorded and BaseScan-verified (deployment JSONs).
- [x] Owner smoke purchase recorded on Base.
- [x] Offline production suite green (74/74 as of 2026-09-04).
- [x] Frontend records #219 approval with `launchAuthorized: true` and separately blocks the expired window with `purchaseAuthorized: false`.
- [ ] Independent reviewer named + sign-off for exact commit.
- [ ] Owner/treasury separation decision (accept EOA or remediate).
- [ ] Terms, risk, jurisdiction, incident response, support channel approved.
- [ ] Liquidity plan either fully specified or explicitly deferred.
- [x] Owner approval recorded under closed issue #219.
- [x] `launchAuthorized: true` committed after #219 approval; live purchase permission remains a separate gate.
- [ ] Optional: wallet matrix (MetaMask / Coinbase desktop + mobile) after auth.
- [ ] Optional: low-value public canary only after auth.

## Evidence table

| Check | Value / link | Timestamp (UTC) | Reviewer |
|---|---|---|---|
| Deployed commit (candidate) | `417e2dbde2aae254f81813c0d62e254668d9ccea` | 2026-09-04 | _pending_ |
| AETH | `0xecf7â€¦8E4e` | recorded | BaseScan |
| Presale | `0xe0A3â€¦5A3d` | recorded | BaseScan |
| Smoke purchase | `0xd16fâ€¦5728` | 2026-07-18 | owner |
| Offline suite | 74/74 | 2026-09-04 | sandbox |
| Public launch decision | **not approved** | â€” | â€” |

## Decision

- **NO-GO for new public purchases** while `purchaseAuthorized: false`, the on-chain sale window is closed, or replacement deployment evidence is incomplete.
- **GO for a replacement public presale** only after explicit schedule approval, new Base deployment/funding, source/runtime verification, smoke evidence, canonical-address publication, and a deliberate `purchaseAuthorized: true` commit.
