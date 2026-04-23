# Launch Execution Runbook — 2026-04-23

This runbook packages the remaining launch-critical and short-term actions for Aetheron (AETH) into one place.

## Manual-only tasks

These still require wallet access, third-party accounts, or live market state and cannot be completed directly from the repo:

1. Seed liquidity on QuickSwap
2. Run live buy -> stake -> unstake -> sell validation
3. Submit / update DexScreener
4. Submit CoinGecko
5. Submit CoinMarketCap

## Canonical project data

- Token Name: Aetheron
- Symbol: AETH
- Network: Polygon Mainnet
- Token Contract: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- Staking Contract: `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
- QuickSwap Add Liquidity URL: `https://quickswap.exchange/#/add/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- QuickSwap Trade URL: `https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- DexScreener Pair URL: `https://dexscreener.com/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D`
- DexTools Pair URL: `https://www.dextools.io/app/polygon/pair-explorer/0xd57c5E33ebDC1b565F99d06809debbf86142705D`
- Website: `https://mastatrill.github.io/Aetheron_platform/`
- Analytics Dashboard: `https://mastatrill.github.io/Aetheron_platform/analytics-dashboard.html`
- GitHub Repo: `https://github.com/MastaTrill/Aetheron_platform`
- PolygonScan Token: `https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- PolygonScan Staking: `https://polygonscan.com/address/0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
- Contact Email: `williammccoy2012@gmail.com`
- Twitter/X: `https://x.com/William_McCoy_`

## 1) Seed liquidity on QuickSwap

### Recommended starting band
- Medium launch: **1,000 USDC + 1,000,000 AETH**

### Execution checklist
- [ ] Connect MetaMask on Polygon
- [ ] Open the QuickSwap add-liquidity URL
- [ ] Approve USDC
- [ ] Approve AETH
- [ ] Supply 1,000 USDC + 1,000,000 AETH
- [ ] Save the LP pair link and transaction hash
- [ ] Confirm pair visibility in PolygonScan holders list

### Evidence to save
- LP creation transaction hash
- Screenshot of QuickSwap pool
- Screenshot of pair on DexScreener once indexed

## 2) Run live buy -> stake -> unstake -> sell validation

### Validation script
- [ ] Buy a small amount of AETH on QuickSwap
- [ ] Verify wallet balance updates
- [ ] Stake into a live pool
- [ ] Verify dashboard reflects staked balance
- [ ] Unstake or claim according to pool flow
- [ ] Sell a small amount back to USDC
- [ ] Record slippage, latency, and UI mismatches

### Pass criteria
- No broken approvals
- No stale balances
- No dashboard / contract mismatch
- No unexpected revert during buy, stake, unstake, or sell

## 3) DexScreener submission/update

### Submission URL
- `https://dexscreener.com/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D`

### Copy-paste payload
```text
Token Name: Aetheron
Symbol: AETH
Description: Next-generation DeFi staking platform on Polygon offering 8-18% APY with transparent analytics, low fees, and flexible staking pools.
Website: https://mastatrill.github.io/Aetheron_platform/
Twitter: https://x.com/William_McCoy_
Email: williammccoy2012@gmail.com
Logo: 200x200 PNG
```

### Done when
- [ ] Pair indexed
- [ ] Price visible
- [ ] Liquidity visible
- [ ] Socials / website visible

## 4) CoinGecko submission

### Submission URL
- `https://www.coingecko.com/en/coins/new`

### Copy-paste payload
```text
Token Name: Aetheron
Ticker: AETH
Contract Address: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
Blockchain: Polygon
Website: https://mastatrill.github.io/Aetheron_platform/
GitHub: https://github.com/MastaTrill/Aetheron_platform
Exchange: QuickSwap V2
Trading Pair: AETH/WMATIC
Pair Contract: 0xd57c5E33ebDC1b565F99d06809debbf86142705D
Total Supply: 1,000,000,000
Max Supply: 1,000,000,000
Contact Email: williammccoy2012@gmail.com
Twitter: https://x.com/William_McCoy_
Description: Aetheron is a transparent DeFi staking platform on Polygon with flexible pools, low transaction costs, verified contracts, and a live analytics dashboard.
```

### Required assets
- [ ] 200x200 PNG logo
- [ ] Whitepaper URL or PDF
- [ ] Liquidity proof
- [ ] Social links

## 5) CoinMarketCap submission

### Submission URL
- `https://coinmarketcap.com/request/`

### Copy-paste payload
```text
Project Name: Aetheron Platform
Cryptoasset Name: Aetheron
Ticker: AETH
Platform: Polygon (MATIC)
Contract Address: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
Project Launch Date: January 2026
Website: https://mastatrill.github.io/Aetheron_platform/
Analytics: https://mastatrill.github.io/Aetheron_platform/analytics-dashboard.html
GitHub: https://github.com/MastaTrill/Aetheron_platform
Pair Exchange: QuickSwap
Pair URL: https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
LP / Pair Contract: 0xd57c5E33ebDC1b565F99d06809debbf86142705D
Email: williammccoy2012@gmail.com
Twitter: https://x.com/William_McCoy_
Description: Aetheron is a high-yield DeFi staking platform built on Polygon with flexible staking pools, low fees, verified smart contracts, and real-time analytics.
```

### Required assets
- [ ] 200x200 PNG logo
- [ ] Liquidity proof
- [ ] Trading pair proof
- [ ] Whitepaper URL or PDF

## 6) Monitoring dashboard expansion

### Internal operator dashboard additions
- [ ] Validator heartbeat / last seen
- [ ] Bridge event count
- [ ] Bridge error count
- [ ] Liquidity depth
- [ ] Recent staking tx count
- [ ] Holder count trend
- [ ] Buy / sell volume snapshots
- [ ] Alert panel for failed approvals or bridge interruptions

### Public trust dashboard additions
- [ ] Current pair link
- [ ] DexScreener link
- [ ] Live price
- [ ] Live liquidity
- [ ] Holder count
- [ ] Last update timestamp

## 7) Public-facing stress test / TPS validation

### Minimum test plan
- [ ] Swap throughput under concurrent users
- [ ] Dashboard latency under load
- [ ] Staking latency under repeated transactions
- [ ] Error rate under buy/stake/unstake/sell flows
- [ ] Bridge event processing latency (if enabled in test env)

### Reporting template
```text
Test Date:
Environment:
Concurrent Users:
Transaction Count:
Average Swap Latency:
Average Stake Latency:
Average Unstake Latency:
Failure Rate:
Observed Bottlenecks:
Recommended Fixes:
```

## GitHub tracking

Create or update issues for:
- liquidity + live trade validation
- listing submissions
- monitoring dashboard expansion
- TPS / public validation report
