# Aetheron Base Mainnet — Post-Deployment Verification

**Status as of July 16, 2026:** The AETH token and presale have deployment records on Base mainnet. This document replaces the obsolete Polygon deployment instructions.

## Active contracts

- **AETH token:** `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- **Aetheron presale:** `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`
- **Network:** Base mainnet
- **Chain ID:** `8453`
- **Native currency:** ETH

## 1. Read-only verification

Before sending funds or opening sales, verify the following through BaseScan or a trusted Base RPC:

### Token

- Address contains deployed bytecode.
- Source code is verified.
- Name, symbol, decimals, total supply, owner, and presale balance match the intended deployment.
- Presale tax/exclusion permissions match the contract design.

### Presale

- Address contains deployed bytecode.
- Source code and constructor arguments are verified.
- `token()` returns the active AETH token address.
- Record `rate()`, `weiRaised()`, `softCap()`, `hardCap()`, `minContribution()`, `maxContribution()`, `startTime()`, and `endTime()`.
- Record `finalized()`, `cancelled()`, and the presale's AETH balance.
- Confirm the AETH inventory covers all tokens that can still be sold.

## 2. Local checks

From `smart-contract/`:

```bash
npm ci
npm run compile
npm test
```

Do not proceed if compilation, tests, or dependency installation fails.

## 3. Purchase-flow validation

The production purchase flow must be tested without risking user funds:

1. Fix the frontend hard-cap calculation so `hardCapETH` is populated from `hardCap()`, not `softCap()`.
2. Run the complete flow against Base Sepolia or a Base-mainnet fork.
3. Test below-minimum, above-maximum, before-start, after-end, cap-exceeded, insufficient-inventory, cancelled, and finalized cases.
4. Confirm a valid purchase emits `TokensPurchased`, increments `weiRaised`, records the contribution, and assigns or transfers the correct AETH amount.
5. Only after simulation passes, execute a deliberately small controlled Base-mainnet purchase from a test wallet.

## 4. Security dependencies

Several Snyk PRs are stale and currently conflict with `main`. Do not force-merge them. Rebase each fix or apply the dependency upgrade manually, regenerate the affected lockfile with `npm install`, then compile and test before merging.

At minimum, review:

- `smart-contract/`: OpenZeppelin upgrade from `4.8.0` to a compatible patched release.
- `mobile-app/`: `fast-xml-parser` and `minimatch` fixes.
- repository root: current transitive dependency findings.

## 5. Launch gate

The presale should not be publicly announced until all of these are complete:

- [ ] Bytecode confirmed at both Base addresses
- [ ] Source and constructor arguments verified
- [ ] Presale parameters recorded and reviewed
- [ ] AETH inventory confirmed
- [ ] Frontend hard-cap bug fixed
- [ ] Fork/testnet purchase suite passed
- [ ] Small controlled mainnet purchase passed
- [ ] Security dependency updates compiled and tested
- [ ] Website displays Base, ETH, and the correct addresses everywhere

## Secret handling

Never commit private keys, mnemonic phrases, API keys, or funded-wallet credentials. Use an ignored `.env` file or a secure deployment secret manager.