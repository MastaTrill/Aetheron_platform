# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |

## Reporting a Vulnerability

Report security issues to **aetheron.solana@gmail.com**. We aim to respond within 48 hours.

## Known Accepted Risks

- **Smart-contract package** depends on `@biconomy/bundler` and `@biconomy/paymaster` (v4.1.1), which internally bundle `ethers@5.8.0`. This path pulls in `elliptic@6.6.1`, which carries a low-severity advisory (GHSA-848j-6mx2-7j84) with **no upstream fix**.
- We have reduced transitive vulnerabilities from **45** to **8 low-severity** by upgrading Biconomy v3 → v4 and removing unused `@nomicfoundation/hardhat-verify`.
- The remaining low-severity `elliptic` exposure can only be fully eliminated by replacing Biconomy with an alternative smart-account stack, which is a planned future migration. It is accepted as a documented risk until that migration is completed.

## Dependency Hardening

- All other packages (`aetheron-node`, `mobile-app`, `backend`, `backend-api`, `react-app`, `dashboard-test-isolated`) are at **0 vulnerabilities**.
- We use npm `overrides` in `smart-contract/package.json` to patch transitive dependencies where possible.
- CI runs `npm audit` and contract tests on every push.

## Last Updated

2026-07-01
