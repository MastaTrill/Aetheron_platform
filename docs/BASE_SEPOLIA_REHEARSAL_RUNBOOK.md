# Base Sepolia Presale Rehearsal Runbook

This runbook is the mandatory testnet gate before any new Aetheron Platform mainnet launch action. It does not authorize Base mainnet transactions.

## Frozen rehearsal scope

The protected workflow deploys fresh Base Sepolia-only contracts from the reviewed commit:

- `MockAETH`
- `AetheronPresaleV2` success-path instance
- `AetheronPresaleV2` refund-path instance
- `AetheronStaking`

The workflow never changes the published Base mainnet token or presale. Testnet contracts are disposable evidence targets.

## Protected environment

Create the GitHub environment `base-sepolia-presale` with:

- at least one required deployment reviewer;
- deployment branch restrictions allowing only the reviewed release branch or `main`;
- secret `BASE_SEPOLIA_RPC_URL`;
- secret `BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY`;
- secret `BASESCAN_API_KEY` or `ETHERSCAN_API_KEY`;
- optional environment variable `REHEARSAL_TREASURY_ADDRESS`.

The deployer must hold at least `0.01` Base Sepolia ETH. The treasury may equal the deployer for a disposable testnet rehearsal, but production ownership and treasury separation remain a separate mainnet gate.

## Phase 1: readiness

Run **Base Sepolia Presale Rehearsal** with:

- `broadcast`: `false`
- `confirmation`: blank

The readiness job must pass all of the following:

1. protected environment reviewer and branch-policy validation;
2. exact dependency installation;
3. Solidity compilation;
4. the repository presale and staking test suite;
5. Base Sepolia chain ID `84532` validation;
6. deployer-key and balance validation;
7. deployment artifact validation.

The job uploads `base-sepolia-presale-readiness-<run-id>` even when a later step fails.

## Phase 2: guarded rehearsal

Only after readiness is green, rerun with:

- `broadcast`: `true`
- `confirmation`: `DEPLOY_BASE_SEPOLIA_REHEARSAL`

Approve the protected environment. The workflow then performs these on-chain checks:

### Presale success path

1. deploy and fund a fresh success-path presale;
2. wait for the sale start;
3. buy exactly the configured hard cap;
4. finalize the sale;
5. claim purchased tokens;
6. withdraw raised test ETH to the rehearsal treasury;
7. confirm the presale retains no ETH and no unclaimed buyer allocation.

### Presale refund path

1. deploy and fund a separate refund-path presale;
2. buy below its hard cap;
3. cancel as owner;
4. claim the contributor refund;
5. confirm the contribution and contract ETH balance are cleared.

### Staking and privilege path

1. deploy staking against the fresh mock token;
2. deposit test rewards;
3. stake into pool `0`;
4. confirm an early normal unstake is rejected by the production lock rules;
5. exercise `emergencyUnstake` and confirm all stake accounting is cleared;
6. confirm non-owner presale cancellation is rejected;
7. confirm non-owner pool administration is rejected.

A normal time-locked unstake still requires the contract's one-hour minimum and pool lock duration. The exact lock behavior remains covered by the repository test suite; the public-chain rehearsal proves the lock rejection and emergency exit without weakening production constants.

## Source verification and immutable evidence

The workflow submits all four deployed contracts to BaseScan Sepolia through the Etherscan V2 API and reads the verified source back. The uploaded rehearsal artifact must include:

- workflow run ID and reviewed commit SHA;
- deployer and treasury addresses;
- every deployed contract address;
- every deployment and functional transaction hash;
- deployment block numbers and gas used;
- runtime bytecode hashes;
- constructor arguments;
- successful and rejected-path assertions;
- BaseScan source-verification URLs;
- `base-sepolia-presale-manifest.sha256`.

The canonical manifest is:

`smart-contract/deployments/base-sepolia-presale-rehearsal.json`

Its final status must be `verified-rehearsal`.

## Evidence acceptance

Do not mark the Base Sepolia section of `docs/LAUNCH_HARDENING_CHECKLIST.md` complete until the exact workflow run URL, artifact, manifest digest, and explorer links have been reviewed and retained. Do not copy testnet addresses into the production frontend.

## Mainnet gate

A successful rehearsal is necessary but not sufficient for mainnet. Mainnet still requires:

- resolution or formal acceptance of remaining security findings;
- required branch-protection checks on `main`;
- production multisig and timelock ownership review;
- two-person parameter review;
- final bytecode and source verification;
- owner-wallet smoke purchase authorization;
- rollback and incident-response evidence.
