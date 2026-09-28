# 🌊 Aetheron Liquidity Setup Guide



> [!WARNING]
> **Production notice:** this document contains legacy Polygon / QuickSwap material. Do not treat those references as the current production path.
> The canonical production network is **Base Mainnet (Chain ID 8453)**. Current AETH: `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`. The recorded Base presale has ended, refunds are available, and no canonical Base liquidity pool is live.
> For current truth, use [`README.md`](./README.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md), [`docs/PRODUCTION_READINESS_EVIDENCE.md`](./docs/PRODUCTION_READINESS_EVIDENCE.md), and the machine-readable Base deployment records under `smart-contract/deployments/`.

## Critical: Add Liquidity to Launch AETH Token

Your token is deployed but has **ZERO liquidity**. Nobody can trade until you create a liquidity pool.

---

## 📋 Prerequisites

- [ ] MetaMask wallet connected to Polygon
- [ ] AETH tokens in your wallet
- [ ] USDC or MATIC for pairing
- [ ] Extra MATIC for gas fees (~0.1 MATIC)

---

## 🎯 Step 1: Decide Your Liquidity Amount

### Recommended Starting Liquidity

**Option A: Small Launch (Testing)**
- 100,000 AETH + $100 USDC
- Creates initial price: ~$0.001 per AETH
- Market cap: ~$1,000

**Option B: Medium Launch (Recommended)**
- 1,000,000 AETH + $1,000 USDC
- Creates initial price: ~$0.001 per AETH
- Market cap: ~$1,000

**Option C: Strong Launch**
- 10,000,000 AETH + $10,000 USDC
- Creates initial price: ~$0.001 per AETH
- Market cap: ~$10,000

**Your choice determines the initial price!**

---

## 🚀 Step 2: Add Liquidity on QuickSwap

### Access QuickSwap

1. Go to: https://quickswap.exchange/#/pools
2. Connect your MetaMask wallet
3. Ensure you're on **Polygon Network**

### Create Pool

1. Click **"+ New Position"** or **"Add Liquidity"**

2. **Select Token Pair:**
   - Token A: Select USDC (or MATIC)
   - Token B: Import AETH
     - Paste: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
     - Click "Import"

3. **Enter Amounts:**
   - Enter your USDC amount (e.g., 1000 USDC)
   - Enter your AETH amount (e.g., 1,000,000 AETH)
   - This sets the initial price ratio

4. **Review Settings:**
   - Fee Tier: **0.30%** (standard)
   - Price Range: **Full Range** (for initial liquidity)

5. **Approve Tokens:**
   - Click "Approve AETH" → Confirm in MetaMask
   - Click "Approve USDC" → Confirm in MetaMask
   - Wait for confirmations

6. **Add Liquidity:**
   - Click "Supply" or "Add"
   - Review transaction details
   - Confirm in MetaMask
   - Wait for confirmation (~10 seconds)

### Success! 🎉

You'll receive LP (Liquidity Provider) tokens representing your position.

---

## 📊 Step 3: Verify Liquidity

1. Go to: https://quickswap.exchange/#/swap
2. Select AETH in the swap interface
3. You should now see a price displayed!
4. Try swapping a small amount to test

### Check on PolygonScan

1. Go to: https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
2. Look for "DEX Trades" or "Holders" section
3. Should show QuickSwap pair address

---

## 💰 Step 4: Calculate Initial Market Cap

```
Example with 1M AETH + 1000 USDC:
- Price per AETH = 1000 / 1,000,000 = $0.001
- Total Supply = 1,000,000,000 AETH
- Market Cap = 1B × $0.001 = $1,000,000

This is your starting market cap!
```

---

## ⚠️ Important Warnings

### Lock Your Liquidity (Recommended)

To build trust, consider locking liquidity for 3-12 months:
- Use: https://mudra.website/ or similar
- Prevents "rug pull" concerns
- Increases investor confidence

### Don't Remove Liquidity

- Removing liquidity kills trading
- Token becomes "dead"
- Destroys investor confidence

### Start Conservative

- You can always ADD more liquidity
- You can't easily reduce without impacting price
- Better to start smaller and grow

---

## 🎯 After Adding Liquidity

### Immediate Next Steps

1. **Update Your Website**
   - Add "Buy on QuickSwap" button
   - Link to: `https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`

2. **Test Everything**
   - Buy small amount on QuickSwap
   - Verify it works
   - Check price updates on your dashboard

3. **Announce to Community**
   - "🎉 AETH is now live on QuickSwap!"
   - Share trading link
   - Show liquidity proof

4. **Submit to Aggregators**
   - CoinGecko: https://www.coingecko.com/en/coins/new
   - CoinMarketCap: https://coinmarketcap.com/request/
   - DexTools: https://www.dextools.io/
   - Both require liquidity FIRST

---

## 🔧 Troubleshooting

### "Insufficient Liquidity" Error
- You haven't added liquidity yet
- Go back to Step 2

### "Price Impact Too High"
- Liquidity is too low
- Add more liquidity
- Or trade smaller amounts

### Transaction Keeps Failing
- Increase slippage tolerance (try 1-3%)
- Ensure you have MATIC for gas
- Check network isn't congested

### Can't Find AETH Token
- Use "Import Token" feature
- Paste contract: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- Click "I understand" warnings

---

## 📈 Growth Strategy

### Phase 1: Initial Liquidity (Day 1)
- Start with conservative amount
- Test trading works
- Verify dashboard shows correct data

### Phase 2: Community Building (Week 1)
- Social media announcements
- Submit to listing sites
- Engage with early holders

### Phase 3: Liquidity Growth (Month 1)
- Add more liquidity as volume grows
- Consider liquidity mining incentives
- Build trading volume

### Phase 4: Ecosystem Development (Month 2+)
- Launch staking pools
- Partner with other projects
- Expand to other DEXs

---

## 🎯 Quick Action Checklist

- [ ] Decide liquidity amount
- [ ] Ensure you have AETH + USDC/MATIC
- [ ] Go to QuickSwap.exchange
- [ ] Add liquidity following Step 2
- [ ] Test swap small amount
- [ ] Update website with trading link
- [ ] Announce launch
- [ ] Submit to CoinGecko/CMC

---

## 📞 Need Help?

**QuickSwap Docs:** https://docs.quickswap.exchange/
**Polygon Support:** https://support.polygon.technology/
**Community:** Your Telegram/Discord channel

---

**⚡ Without liquidity, your token cannot trade. This is the CRITICAL next step!**

Good luck with your launch! 🚀
