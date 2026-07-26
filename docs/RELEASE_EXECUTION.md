# Aetheron Platform Release Execution

**Canonical network:** Base Mainnet (`8453`)  
**Canonical AETH token:** `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`  
**Current state:** Token deployed; trading disabled; presale and staking launch BLOCKED pending rehearsal and evidence.

## Product boundary

This repository ships only the AETH token integration, presale, staking, public wallet experience, treasury operations, and their release evidence. Sentinel contracts, general AI agents, mobile experiments, and legacy multichain prototypes are not release requirements.

## Gate 1 — Canonical configuration

- [ ] Frontend consumes addresses from machine-readable deployment records.
- [ ] Every address is labeled with network and status.
- [ ] No Polygon, Mumbai, Solana, simulation, or Base Sepolia address is presented as production.
- [ ] Token owner, treasury, presale, staking, multisig, and timelock addresses are recorded together.
- [ ] Trading remains disabled throughout rehearsal.

## Gate 2 — Protected Base Sepolia rehearsal

Deploy a fresh rehearsal release and preserve all addresses, transaction hashes, block numbers, deployer addresses, owners, bytecode hashes, source-verification URLs, and manifest digests.

Execute and evidence:

- [ ] presale contribution within limits;
- [ ] rejected contribution outside limits;
- [ ] successful sale finalization;
- [ ] token claim;
- [ ] cancelled sale;
- [ ] contributor refund;
- [ ] treasury withdrawal after valid success only;
- [ ] staking deposit and reward accounting;
- [ ] normal unstake;
- [ ] emergency exit;
- [ ] pause and recovery path;
- [ ] unauthorized privilege calls reverting.

## Gate 3 — Economic and privilege review

- [ ] Confirm hard cap, soft cap, price, opening/closing times, per-wallet limits, token allocation, vesting, refund conditions, and treasury destination.
- [ ] Confirm owner, treasury, multisig, and timelock separation.
- [ ] Decode and review every privileged method.
- [ ] Verify no public-fund path can bypass sale state or accounting.
- [ ] Complete independent smart-contract review and resolve critical/high findings.

## Gate 4 — Public application readiness

- [ ] Wallet connects only to the intended network.
- [ ] Wrong-network state is explicit and fail-closed.
- [ ] UI reads canonical contract state rather than hard-coded marketing values.
- [ ] Purchase, claim, refund, stake, and unstake states are tested end to end.
- [ ] Errors display transaction-safe guidance without asking users for keys or seed phrases.
- [ ] Terms, risk disclosures, jurisdictional restrictions, and support channel are approved before accepting public funds.

## Gate 5 — Mainnet authorization

Base Sepolia success does not authorize Base Mainnet activity. A separate written release decision must identify:

- exact contracts and constructor arguments;
- deployer and governance controller;
- treasury destination;
- trading/liquidity plan;
- approved release commit;
- independent reviewer;
- rollback or cancellation conditions.

## Launch evidence package

Store an immutable package containing test results, rehearsal receipts, explorer verification links, source and bytecode hashes, deployment manifest digest, privilege map, reviewer sign-off, and the explicit mainnet authorization.

## Prohibited actions while blocked

- Do not accept public funds.
- Do not enable trading or add canonical liquidity.
- Do not describe the presale or staking release as production-approved.
- Do not copy testnet addresses into production configuration.
- Do not store private keys, mnemonics, or authenticated RPC URLs in GitHub.

## Definition of done

The platform is launch-ready only when an independent reviewer can replay the evidence trail from the approved commit through the Base Sepolia economic rehearsal and confirm the separately authorized Base Mainnet configuration.