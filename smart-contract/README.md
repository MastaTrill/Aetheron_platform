# Aetheron Smart Contracts

This directory contains the Aetheron smart-contract workspace. Active production configuration is Base-first and must follow the repository's canonical deployment manifests and release gates.

## Canonical production truth

- Network: **Base Mainnet**
- Chain ID: **8453**
- AETH token: **`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`**
- Canonical deployment manifest: `deployments/aeth-base.json`
- Cross-project registry: `../docs/AETHERON_CONTRACT_REGISTRY.json`

Do not substitute addresses from old Polygon/Mumbai deployment notes. Legacy Polygon history is retained only as historical evidence and is not an operational deployment path.

## Release safety status

The AETH token exists on Base Mainnet, but public presale funding, staking launch, trading enablement, and canonical liquidity remain release-gated. Follow repository issues `#217` and `#219` and `../docs/RELEASE_EXECUTION.md` before any production signing or broadcast.

While those gates remain open:

- do not accept public presale funds;
- do not enable trading;
- do not add canonical mainnet liquidity;
- do not claim presale or staking is production-approved;
- do not put private keys, mnemonics, wallet exports, or authenticated RPC URLs in GitHub or CI.

## Setup

```bash
cd smart-contract
npm install
npm run compile
npm test
```

Useful test commands:

```bash
npm run test:production-simulation
npm run test:base-fork
```

The Base fork test is read-only and may use `BASE_FORK_RPC_URL` or `BASE_RPC_URL`.

## Canonical validation

From the repository root, run:

```bash
node scripts/validate-canonical-deployments.mjs
node scripts/check-operational-launch-gates.mjs
node scripts/scan-tracked-secrets.mjs
```

These checks enforce the canonical Base deployment record, launch-gate behavior, and tracked-secret hygiene.

## Read-only Base verification

```bash
npm run verify:base:readonly
npm run verify:basescan
```

Use read-only verification before considering any state-changing action.

## Base Sepolia rehearsal

The protected rehearsal path is Base Sepolia, not Mumbai or Polygon:

```bash
npm run rehearsal:base-sepolia:presale
npm run verify:base-sepolia:rehearsal
```

A rehearsal is evidence gathering, not production authorization. Preserve deployment addresses, transaction hashes, block numbers, source/bytecode hashes, explorer verification, manifest digest, and failure-path results as required by issue `#217`.

## Deployment commands

Active package commands intentionally omit Polygon and Mumbai deployment/treasury/verification aliases.

Base-related commands include:

```bash
npm run deploy:base
npm run deploy:base-sepolia
npm run deploy:treasury:base
npm run verify:base
```

Presale deployment uses the bounded Base script:

```bash
npm run deploy:base-presale:dry-run
npm run deploy:presale:base:safe
```

**Do not run a state-changing Base Mainnet command unless the exact commit, addresses, roles, economic parameters, and transaction are explicitly authorized under issue `#219`.**

## Environment variables

Use `.env` locally and keep it out of version control. Depending on the command, common variables include:

- `BASE_RPC_URL`
- `BASE_FORK_RPC_URL`
- `BASE_SEPOLIA_RPC_URL`
- `BASESCAN_API_KEY`
- `PRIVATE_KEY` only for an explicitly authorized local signing context

Never commit a real key, mnemonic, wallet export, or authenticated RPC URL.

## Troubleshooting

### Compile failure

```bash
npm install
npm run clean
npm run compile
```

### Wrong network

Confirm the intended chain ID before signing:

- Base Mainnet: `8453`
- Base Sepolia: `84532`

### Canonical address mismatch

Do not edit frontend or deployment values independently. Fix the canonical manifest/registry mismatch first and rerun:

```bash
cd ..
node scripts/validate-canonical-deployments.mjs
```

### Production action blocked

That is expected when launch prerequisites are incomplete. Read `../docs/RELEASE_EXECUTION.md` and the open release-gate issues rather than bypassing the check.

## Security rules

- Keep production secrets out of source control and CI logs.
- Verify contract code, constructor arguments, roles, and balances before public use.
- Separate deployer, owner, treasury, multisig, and timelock roles according to the approved release plan.
- Re-read critical on-chain state through independent RPC providers before launch authorization.
- Preserve reproducible evidence for every rehearsal and production decision.

## License

MIT — see the repository license.
