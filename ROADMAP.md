# Aetheron Platform — Release Roadmap

This roadmap tracks the current Base-first release path. Historical Polygon/Mumbai deployment plans are not active operational guidance.

## Current canonical state

- Production network: **Base Mainnet** (`8453`)
- Canonical AETH: **`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`**
- Canonical deployment manifest: `smart-contract/deployments/aeth-base.json`
- Cross-project registry: `docs/AETHERON_CONTRACT_REGISTRY.json`
- Public frontend deployment/configuration is expected to fail closed when presale state is not verified.

## Completed engineering controls

- [x] Canonical Base deployment validator added.
- [x] Production-source scanning blocks known stale Polygon/Mumbai production markers.
- [x] Operational launch-gate checks added.
- [x] Tracked-secret scanner added to CI.
- [x] Public frontend bundle migrated to Base-current configuration.
- [x] Legacy Polygon/Mumbai npm deploy, treasury, and verify entry points retired from the active smart-contract package.
- [x] Active developer documentation updated to Base-only operational guidance.

## Current release blockers

### 1. Complete cleanup regression coverage — issue #214

- [x] Canonical Base chain ID and AETH address enforced.
- [x] Active public surfaces removed from stale Polygon/Mumbai production configuration.
- [x] Legacy smart-contract npm entry points retired.
- [ ] Keep historical material clearly separated from active operational guidance as future files are touched.
- [ ] Continue secret-history review/rotation when evidence indicates an actual exposed credential.

### 2. Protected Base Sepolia rehearsal — issue #217

Before any public-funds launch:

- [ ] Deploy the approved rehearsal release on Base Sepolia.
- [ ] Exercise success, cancellation, refund, claim, treasury withdrawal, staking, unstaking, emergency exit, and unauthorized-call paths.
- [ ] Preserve addresses, transaction hashes, block numbers, source/bytecode hashes, explorer verification, and manifest digest.
- [ ] Review economic parameters and privilege separation.
- [ ] Obtain independent review of the exact release candidate.

The rehearsal must be independently reproducible. A successful rehearsal is evidence, not mainnet authorization.

### 3. Final Base Mainnet authorization — issue #219

Before any production signing or broadcast:

- [ ] Resolve every prerequisite recorded in issue #219.
- [ ] Record the exact approved commit SHA and chain ID `8453`.
- [ ] Record exact presale/staking addresses and constructor arguments.
- [ ] Verify deployer, owner, treasury, multisig, and timelock roles.
- [ ] Approve economic parameters, liquidity plan, transaction limits, rollback conditions, and incident response.
- [ ] Obtain named independent reviewer sign-off.
- [ ] Record explicit time-bounded written launch authorization.

While #219 remains open:

- do not accept public presale funds;
- do not enable trading;
- do not add canonical mainnet liquidity;
- do not market the presale/staking release as production-approved.

## Engineering workstream

### Repository and CI

```bash
npm install
npm test
node scripts/validate-canonical-deployments.mjs
node scripts/check-operational-launch-gates.mjs
node scripts/scan-tracked-secrets.mjs
```

Goal: keep every pull request green on canonical deployment truth, source safety, launch gates, and secret scanning.

### Smart contracts

```bash
cd smart-contract
npm install
npm run compile
npm test
npm run test:production-simulation
npm run test:base-fork
```

Goal: reproducible build/test evidence for the exact release candidate.

### Base Sepolia rehearsal

```bash
npm run rehearsal:base-sepolia:presale
npm run verify:base-sepolia:rehearsal
```

Goal: produce the evidence package required by issue #217 without treating a testnet result as production approval.

### Frontend

```bash
cd ..
npm run build
npm test
```

Goal: keep public surfaces canonical to Base, wrong-network safe, and explicit about unverified launch state.

## Security principles

- Never commit or post private keys, mnemonics, wallet exports, or authenticated RPC URLs.
- Do not bypass release gates because a transaction technically succeeds.
- Verify critical on-chain state through independent sources before authorization.
- Keep historical chain/deployment records separate from active commands and production configuration.
- Preserve reproducible evidence for security-sensitive release decisions.

## Definition of production-ready

Aetheron is production-ready for public presale/staking/trading only when the exact release candidate has passing CI, reproducible Base Sepolia rehearsal evidence, independent review, verified role separation and economic parameters, and explicit Base Mainnet authorization recorded under issue #219.
