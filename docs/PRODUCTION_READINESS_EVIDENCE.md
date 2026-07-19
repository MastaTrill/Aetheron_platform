# Aetheron Production Readiness Evidence

This record is the release gate for the Base presale. A green CI run alone is not authorization to launch or move funds.

## Published Base configuration

- Network: Base Mainnet (`8453`)
- AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
- Verified owner: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Verified treasury: `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`
- Deployment record: `smart-contract/deployments/presale-base.json`

The frontend fails closed if deployed bytecode is missing, token linkage is wrong, or owner/treasury do not match the verified deployment record.

## Required evidence before public onboarding

- [ ] `https://aetrs.com/` and `/presale.html` return HTTP 200.
- [ ] Production Readiness Monitor passes from the deployed commit.
- [ ] BaseScan source verification links resolve for both contracts.
- [ ] Reconfirm current `owner()`, `treasury()`, `token()`, rate, caps, schedule, `finalized`, and `cancelled` values.
- [ ] Record token inventory and `tokensReserved`; inventory must cover reserved liabilities.
- [ ] Confirm whether the verified owner is an EOA, multisig, or timelock.
- [ ] If it is an EOA, obtain explicit risk acceptance or transfer control through a separately approved transaction.
- [ ] Test MetaMask desktop, Coinbase Wallet desktop, MetaMask mobile deep link, and Coinbase Wallet mobile deep link.
- [ ] Confirm rejected connection, rejected network switch, and rejected transaction leave the UI usable.
- [ ] Perform a low-value canary purchase only after explicit transaction authorization.
- [ ] Record the canary transaction hash and verify the allocation/accounting change.
- [ ] Configure uptime alerts and an incident recipient outside GitHub Actions.
- [ ] Configure alerts for owner change, treasury change, cancellation/finalization, low inventory, and RPC/read failures.

## Evidence table

| Check | Value / link | Timestamp (UTC) | Reviewer |
|---|---|---|---|
| Deployed commit |  |  |  |
| Monitor run |  |  |  |
| Presale bytecode hash |  |  |  |
| Token bytecode hash |  |  |  |
| Owner |  |  |  |
| Treasury |  |  |  |
| Token linkage |  |  |  |
| Rate and caps |  |  |  |
| Schedule and state |  |  |  |
| Inventory / reserved |  |  |  |
| Wallet test evidence |  |  |  |
| Canary transaction |  |  |  |
| Alert destinations |  |  |  |

## Decision

- **NO-GO** while any required evidence item is incomplete.
- **GO** requires a named reviewer, a deployed green monitor run, verified custody, verified inventory, completed wallet tests, and an explicitly authorized canary transaction.
