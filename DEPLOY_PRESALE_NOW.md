# Aetheron Base Presale — Recovery and Replacement Runbook

**Status as of July 16, 2026:** Public purchases are disabled. The previously recorded presale is invalid because its immutable `token()` address does not match the current Base AETH token.

## Current addresses

- **Current Base AETH token:** `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- **Invalid presale — do not use:** `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`
- **Token returned by invalid presale:** `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- **Network:** Base mainnet, chain ID `8453`, native currency ETH

Disposable Base-fork evidence observed:

- `weiRaised = 0`
- expected AETH balance at the invalid presale = `50,000,000 AETH`
- `cancelled = false`
- `finalized = false`
- no real mainnet write was performed during validation

## Stop conditions

Do not:

- send ETH or more AETH to the invalid presale;
- restore its address in either frontend configuration file;
- use any retired hard-coded deploy/fund script;
- publish a presale announcement;
- paste a private key, seed phrase, or RPC secret into chat, an issue, a PR, or a commit.

## 1. Install, compile, and test

From `smart-contract/`:

```bash
npm ci
npm run compile
npm test
npm run test:base-fork
```

The fork test must prove the invalid-token mismatch while no active presale exists. After a corrected deployment, it must prove the new linkage and simulate a minimum purchase inside the disposable fork.

## 2. Run read-only Base inspection

```bash
npm run verify:base:readonly
```

Without `ALLOW_DISABLED_PRESALE=true`, this command intentionally exits nonzero until a valid active replacement is recorded. CI uses `ALLOW_DISABLED_PRESALE=true` only to prove that the current invalid deployment is documented and safely disabled; that does not make the sale launch-ready.

## 3. Review cancellation — no transaction by default

The guarded cancellation tool reads the invalid contract first and refuses to act unless:

- the connected wallet is the contract owner;
- the token mismatch still exists;
- the contract is not finalized or already cancelled;
- the exact confirmation phrase is provided.

Read-only review can be performed by running the verifier and inspecting its artifact. To authorize cancellation locally after owner review:

```bash
CONFIRM_CANCEL_INVALID_PRESALE=CANCEL_MISMATCHED_PRESALE \
  npm run cancel:invalid-base-presale
```

This is an on-chain Base mainnet transaction. Keep `PRIVATE_KEY` in an ignored local `.env` or secure secret manager. Do not run this command until the enhanced read-only report confirms the owner and supported legacy functions.

## 4. Establish recovery for the 50,000,000 AETH

The expected AETH was transferred to a contract whose immutable token reference points to a different token. Do not assume the normal unsold-token withdrawal can recover it. Confirm the deployed bytecode/source and every owner-only recovery selector before attempting any transaction.

## 5. Dry-run the corrected replacement

Set explicit values locally; the safe script has no silent sale-parameter defaults for rate, caps, or contribution limits:

```bash
DRY_RUN=true \
AETH_TOKEN_ADDRESS=0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e \
TREASURY_ADDRESS=0xYourTreasury \
PRESALE_RATE=1000 \
PRESALE_SOFT_CAP_ETH=5 \
PRESALE_HARD_CAP_ETH=25 \
PRESALE_MIN_ETH=0.001 \
PRESALE_MAX_ETH=1 \
npm run deploy:base-presale:dry-run
```

Review the printed deployer, owner, treasury, schedule, required token inventory, and gas-wallet state. Adjust parameters deliberately; the example values are not an approval or recommendation.

## 6. Deploy the corrected presale

Only after the dry run, recovery review, owner approval, and sufficient token/gas balances:

```bash
CONFIRM_BASE_MAINNET_DEPLOY=DEPLOY_CORRECTED_PRESALE \
AETH_TOKEN_ADDRESS=0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e \
TREASURY_ADDRESS=0xYourTreasury \
PRESALE_RATE=... \
PRESALE_SOFT_CAP_ETH=... \
PRESALE_HARD_CAP_ETH=... \
PRESALE_MIN_ETH=... \
PRESALE_MAX_ETH=... \
npm run deploy:presale
```

The guarded script must:

1. confirm Base chain ID `8453`;
2. confirm bytecode at the AETH token address;
3. confirm the deployment wallet owns the token;
4. deploy a fresh presale with the selected treasury;
5. verify `presale.token()` and `presale.treasury()` immediately;
6. exclude the new presale from AETH tax;
7. fund enough AETH for the selected hard cap;
8. verify inventory;
9. write the deployment record and frontend config only after all checks pass.

## 7. Post-deployment gate

Before a public purchase:

```bash
npm run verify:base:readonly
npm run test:base-fork
```

Then verify source and constructor arguments on BaseScan. Source verification matters because it lets users and reviewers compare the published source with deployed bytecode.

A deliberately small real mainnet purchase is the final step and requires explicit wallet-owner approval. Never automate that purchase from CI.
