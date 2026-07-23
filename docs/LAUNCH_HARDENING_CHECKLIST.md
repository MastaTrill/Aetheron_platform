# Aetheron Launch Hardening Checklist

## Security gates

- [x] Slither runs through Foundry.
- [x] CI blocks high-impact Slither findings.
- [x] UUPS treasury implementation disables direct initialization.
- [x] Vendor payout path reviewed and documented.
- [x] NFT mint callbacks protected with checks-effects-interactions and `nonReentrant`.
- [ ] Resolve or formally accept the staking token callback medium finding.
- [ ] Review all remaining low/informational Slither findings.
- [ ] Require Contract Security Validation, Presale Security Gate, Presale PR Gate, and Presale Operations Preflight on `main`.

## Presale controls

- [ ] Confirm token decimals and all price conversion formulas.
- [ ] Confirm per-wallet minimum and maximum purchase limits.
- [ ] Confirm global hard cap and sold-out behavior.
- [ ] Confirm cancellation/refund and emergency withdrawal permissions.
- [ ] Confirm claim schedule, repeated-claim protection, and refund behavior.
- [ ] Test zero-value, boundary, stale-price, malicious-token, and reentrancy cases.

## Base Sepolia rehearsal

Automation and the evidence contract are defined in `docs/BASE_SEPOLIA_REHEARSAL_RUNBOOK.md`. Keep every item below unchecked until a reviewed workflow artifact proves it.

- [ ] Protected `base-sepolia-presale` environment requires a reviewer and restricted deployment branch.
- [ ] Readiness run passes from the exact reviewed commit.
- [ ] Deploy fresh test token, success presale, refund presale, and staking contracts to Base Sepolia.
- [ ] Verify every rehearsal contract on BaseScan Sepolia.
- [ ] Execute buy, finalize, claim, treasury withdrawal, cancellation, and contributor refund flows.
- [ ] Execute stake, locked-unstake rejection, and emergency-unstake flows.
- [ ] Confirm non-owner presale and staking administration calls are rejected.
- [ ] Archive addresses, transaction hashes, runtime bytecode hashes, constructor arguments, logs, and the manifest SHA-256 digest.
- [ ] Record the exact workflow run URL and artifact retention location.

## Mainnet readiness

- [ ] Multisig owns all privileged contracts.
- [ ] Signers use hardware wallets and independent recovery procedures.
- [ ] Sensitive upgrades and parameter changes use a timelock.
- [ ] Mainnet parameters are reviewed by two people.
- [ ] Canary deployment completed with limited funds.
- [ ] Explorer verification completed before public launch.
- [ ] Final addresses, ABIs, release notes, and rollback plan published.

## Launch evidence

- [ ] `MAINNET_EVIDENCE_CHECKLIST.md` completed.
- [ ] Release notes include commit SHA and deployed bytecode hashes.
- [ ] CI run links and Slither/contract-test results archived.
- [ ] Deployment transaction hashes recorded.
- [ ] Ownership-transfer and timelock transactions recorded.
- [ ] Incident response contacts and cancellation/refund procedure documented.
