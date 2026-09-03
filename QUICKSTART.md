# Aetheron Platform — Quick Start

This guide reflects the current Base deployment model. Do not use older Polygon/Mumbai launch instructions for active operations.

## 1. Validate the repository

From the repository root:

```bash
npm install
npm test
node scripts/validate-canonical-deployments.mjs
node scripts/check-operational-launch-gates.mjs
node scripts/scan-tracked-secrets.mjs
```

The canonical production values are:

- Base Mainnet chain ID: `8453`
- AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Deployment manifest: `smart-contract/deployments/aeth-base.json`
- Registry: `docs/AETHERON_CONTRACT_REGISTRY.json`

If the canonical validation fails, fix the manifest/config mismatch before doing anything on-chain.

## 2. Build and test the smart contracts

```bash
cd smart-contract
npm install
npm run compile
npm test
npm run test:production-simulation
```

For read-only Base fork verification:

```bash
npm run test:base-fork
```

Set `BASE_FORK_RPC_URL` or `BASE_RPC_URL` locally when the fork test requires an RPC endpoint.

## 3. Verify Base state without changing it

```bash
npm run verify:base:readonly
npm run verify:basescan
```

Do read-only checks before considering a transaction.

## 4. Rehearse on Base Sepolia

The active rehearsal network is **Base Sepolia** (`84532`). Follow issue `#217` and `docs/RELEASE_EXECUTION.md`.

```bash
npm run rehearsal:base-sepolia:presale
npm run verify:base-sepolia:rehearsal
```

Preserve the required evidence: deployment addresses, transaction hashes, block numbers, bytecode/source hashes, explorer verification, manifest digest, and success/failure-path results.

A successful rehearsal does **not** authorize Base Mainnet launch.

## 5. Production remains gated

Issue `#219` is the final Base Mainnet launch-authorization gate. Until its prerequisites and written authorization are complete:

- do not accept public presale funds;
- do not enable trading;
- do not add canonical mainnet liquidity;
- do not claim presale/staking is production-approved;
- do not place private keys, mnemonics, wallet exports, or signing sessions in GitHub or CI.

## Frontend development

From the repository root:

```bash
npm run dev
```

Build and test the production bundle with:

```bash
npm run build
npm test
```

The public frontend must remain fail-closed when deployment state is unverified or the wallet is on the wrong network.

## Environment safety

Keep secrets only in an approved local or deployment-secret store. Common variables include:

```text
BASE_RPC_URL
BASE_FORK_RPC_URL
BASE_SEPOLIA_RPC_URL
BASESCAN_API_KEY
```

Use `PRIVATE_KEY` only in an explicitly authorized local signing context. Never paste a real private key or mnemonic into source, issues, pull requests, CI logs, or chat.

## Common checks

### Wrong network

Verify chain ID before signing:

- Base Mainnet: `8453`
- Base Sepolia: `84532`

### Missing dependencies

```bash
npm install
```

Run it in the repository root or `smart-contract/` depending on which workspace is failing.

### Contract build problem

```bash
cd smart-contract
npm run clean
npm run compile
npm test
```

### Launch action is blocked

Do not bypass the gate. Check `docs/RELEASE_EXECUTION.md`, issue `#217`, and issue `#219` for the missing evidence or authorization.

## Next safe milestone

Complete and independently reproduce the protected Base Sepolia presale/staking rehearsal. Only after that evidence is complete should the final Base Mainnet authorization be considered.
