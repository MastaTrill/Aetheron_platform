# Base Presale Recovery Evidence — July 17, 2026

## Scope

Repository: `MastaTrill/Aetheron_platform`  
Network: Base mainnet (`8453`)

- Base AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Invalid presale: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`
- Invalid presale immutable token: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- Owner: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`

## Fresh read-only result

Workflow run `29551165619` and artifact `8395785967` confirmed:

- dependency installation: passed
- Solidity compilation: passed
- contract/frontend tests: passed
- invalid-presale recovery inspection: passed
- safely disabled Base state verification: passed
- disposable Base fork simulation: passed
- real Base writes: none

On-chain state observed near Base block `48733867`:

- AETH total supply: `1,000,000,000`
- AETH trading enabled: `false`
- AETH held by invalid presale: `50,000,000`
- ETH raised: `0`
- invalid presale native balance: `0`
- cancelled: `false`
- finalized: `false`
- public frontend presale: disabled

## Recovery conclusion

The deployed invalid presale does **not** expose a usable recovery path for the Base AETH balance:

- `withdrawUnsoldTokens()` exists, but it uses the immutable wrong-token reference.
- It cannot target `0xecf7...8E4e`.
- No scanned generic ERC-20 rescue, recover, sweep, emergency withdrawal, or arbitrary-token withdrawal selector was present.
- No generic recovery probe succeeded.
- `cancel()` successfully simulated from the owner address, but cancellation does not move or recover the 50,000,000 AETH.

Therefore the 50,000,000 AETH is classified as **inaccessible by the deployed interface**. It must be excluded from presale inventory, available supply, circulating-supply claims, treasury balances, and liquidity plans unless new independently verified recovery evidence is produced.

Maximum interface-accessible supply after this lock: `950,000,000 AETH`.

The deployed token has a fixed constructor-minted supply and no external mint function. Do not mint or claim replacement supply.

## Owner-bound blockers

The protected preflight found these repository/environment secrets absent:

- `BASE_RPC_URL`
- `BASE_DEPLOYER_PRIVATE_KEY`
- `PRESALE_TREASURY_ADDRESS`

Because these are absent, the following were not attempted:

- invalid-presale cancellation transaction
- owner-bound corrected deployment dry run
- corrected presale deployment and atomic funding
- BaseScan verification of a replacement contract
- owner-approved small mainnet purchase

Never commit or paste private keys, seed phrases, or RPC credentials. Configure them only as protected GitHub environment secrets or in an ignored local secret store.

## Guarded operations added

- `.github/workflows/presale-ops-preflight.yml` — automatic read-only inspection, tests, fork simulation, and conditional `DRY_RUN=true` rehearsal.
- `.github/workflows/cancel-invalid-presale.yml` — manual, protected-environment cancellation requiring two exact acknowledgement phrases.
- `.github/workflows/deploy-corrected-presale.yml` — existing protected corrected deployment path with explicit sale parameters and confirmation.

A real purchase must remain wallet-owner initiated and must not be automated from CI.
