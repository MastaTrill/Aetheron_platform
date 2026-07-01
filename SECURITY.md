# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |

## Reporting a Vulnerability

Report security issues to **aetheron.solana@gmail.com**. We aim to respond within 48 hours.

## Known Accepted Risks

- No critical, high, or moderate vulnerabilities remain in any package.
- Low-severity findings are re-audited weekly via CI.

## Dependency Hardening

- All packages (`smart-contract`, `aetheron-node`, `mobile-app`, `backend`, `backend-api`, `react-app`, `dashboard-test-isolated`) are at **0 vulnerabilities**.
- We previously used npm `overrides` in `smart-contract/package.json` to patch transitive dependencies. We have since removed the Biconomy smart-account stack (`@biconomy/bundler`, `@biconomy/paymaster`, `@biconomy/account`) which was the source of inherited `ethers@5.x`/`elliptic` advisories.
- CI runs `npm audit` and contract tests on every push.
- The experimental gasless deployment script (`scripts/deploy-gasless.mjs`) has been archived to `scripts/archive/`. If gasless deployment is required again, it should be implemented with a modern stack that does not bundle EOL `ethers@5.x`.

## Last Updated

2026-07-01
