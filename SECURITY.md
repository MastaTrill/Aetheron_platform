# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 2.x | :white_check_mark: |

## Reporting a Vulnerability

Report security issues to **aetheron.solana@gmail.com**. We aim to respond within 48 hours.

Do not include private keys, seed phrases, production credentials, or unredacted customer/payment data in a public GitHub issue.

## Production Dependency Security

Production dependency security is evaluated separately from development tooling. The authoritative production audit command is:

```bash
npm run audit:production
```

The audit enumerates the installed production-only dependency trees for the root application, `backend`, and `smart-contract` with `npm ls --omit=dev --all --json`, then checks every resolved npm package/version against the OSV vulnerability database. The command fails closed if OSV is unavailable or if any production package is reported vulnerable.

### September 3, 2026 hardening audit

Before remediation, the production-only audit identified:

- `protobufjs@7.6.4` — GHSA-j3f2-48v5-ccww; fixed in `7.6.5`.
- `body-parser@2.2.2` — GHSA-v422-hmwv-36x6; fixed in the 2.x line at `2.3.0`.
- `qs@6.15.2` — GHSA-4mjr-xmp4-gh2g and GHSA-x5fp-wj9c-mxmx; fixed in `6.16.0`.

Remediation pins/updates the production trees to patched versions and removes an unintended `backend -> file:..` dependency that had pulled the parent application's development toolchain into the backend dependency graph.

Fresh post-remediation OSV verification result:

- root application: **0 vulnerable production packages**
- backend: **0 vulnerable production packages**
- smart contracts package: **0 vulnerable production packages**

The npm audit service endpoint (`https://registry.npmjs.org/-/npm/v1/security/audits/quick`) was timing out from the build host during this review. That outage is recorded rather than interpreted as a successful npm audit; OSV was used as the independent production audit source.

These statements apply only to production dependency trees. They do **not** claim that every development-only package, archived project, experimental directory, or historical package in the repository has zero advisories.

## Runtime and Release Controls

- Server-side signing routes are authenticated and disabled by default behind an explicit signer-route kill switch.
- Public purchase and public-market authorization remain fail-closed until the release gates are explicitly satisfied.
- Legacy Polygon/Mumbai execution paths are excluded from the production bundle and archived out of active GitHub Actions workflows.
- Mainnet deployment, liquidity, trading, and public-fund actions require separate release authorization and are not implied by passing CI.

## Last Updated

2026-09-03