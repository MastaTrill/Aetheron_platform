# Aetheron Platform — Canonical Project Status

**Status:** Active flagship — **public Base presale authorized**  
**Last updated:** 2026-09-04  
**Canonical role:** Commercial Aetheron product: AETH token, presale, staking, public frontend, wallet onboarding, and treasury-facing operations.

## Production truth

- Canonical production network: **Base Mainnet** (chain ID `8453`).
- Canonical AETH token: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`.
- Corrected Base presale: `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`.
- **Public presale:** `launchAuthorized: true` (owner approved issue **#219** on 2026-09-04). See `docs/evidence/ISSUE_219_APPROVED_2026-09-04.md`.
- **Trading:** still **disabled** on-chain and in product flags (`tradingAuthorized: false`).
- **Canonical liquidity:** **not** authorized (`liquidityAuthorized: false`).
- Owner and treasury recorded as the same EOA (accepted residual risk at approval).
- Invalid legacy presale: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` — do not use.

## Closed gates

- [x] #214 Base migration cleanup
- [x] #217 path evidence (mainnet + suite substitution)
- [x] #219 public presale authorization

## Open / deferred

- [ ] On-chain trading enablement (separate tx + product flag)
- [ ] Canonical liquidity (venue, size, tx)
- [ ] Optional multisig / treasury separation
- [ ] AETH V2 remains `prepared_not_deployed`

## Repository rules

1. Production records live in `smart-contract/deployments/`.
2. Trading and liquidity require separate explicit authorization beyond presale `launchAuthorized`.
3. Sentinel L3 lives in `MastaTrill/Aetheron-Sentinel-L3`.
