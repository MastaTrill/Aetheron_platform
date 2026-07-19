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
- [ ] Confirm pause/unpause and emergency withdrawal permissions.
- [ ] Confirm claim schedule, repeated-claim protection, and refund behavior.
- [ ] Test zero-value, boundary, stale-price, malicious-token, and reentrancy cases.

## Base Sepolia rehearsal

- [ ] Deploy all production contracts to Base Sepolia.
- [ ] Verify every contract on the explorer.
- [ ] Record implementation and proxy addresses separately.
- [ ] Configure treasury, multisig, token allocation, caps, and sale windows.
- [ ] Fund the sale and reward pools.
- [ ] Execute buy, claim, stake, unstake, pause, unpause, and withdrawal flows.
- [ ] Save transaction hashes and screenshots in deployment evidence.

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
- [ ] CI run links and Slither/Forge results archived.
- [ ] Deployment transaction hashes recorded.
- [ ] Ownership-transfer and timelock transactions recorded.
- [ ] Incident response contacts and pause procedure documented.
