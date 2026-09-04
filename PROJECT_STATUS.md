# Aetheron Platform — Canonical Project Status

**Status:** Active flagship — public presale authorized; **trading flag on**; liquidity deferred  
**Last updated:** 2026-09-04

## Production truth

- Network: **Base Mainnet** (`8453`)
- AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`
- **`launchAuthorized: true`** (#219)
- **`tradingAuthorized: true`** (product); **on-chain `tradingEnabled: true`** (audit 2026-09-03)
- **`liquidityAuthorized: false`** — no canonical pool configured
- Owner / treasury: same EOA `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2`

## Closed

- #214 Base cleanup  
- #217 path evidence  
- #219 public presale authorization  
- Trading product authorization (aligned with live chain)

## Open

- [ ] Canonical Base liquidity (venue, size, tx, registry update)  
- [ ] Optional multisig / treasury separation  
- [ ] AETH V2 remains `prepared_not_deployed`  
- [ ] Presale schedule may be expired on-chain — confirm before marketing “open sale”

## Rules

1. `tradingEnabled` ≠ liquid market.  
2. Do not re-call `enableTrading()` (one-way, already true).  
3. Liquidity authorization is a separate step with public receipts.
