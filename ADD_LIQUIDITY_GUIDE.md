# 💧 Adding Liquidity to QuickSwap - Complete Guide

This guide will help you add AETH/POL liquidity to QuickSwap, enabling trading for your token.

---

## 📋 Prerequisites

✅ AETH tokens deployed and trading enabled  
✅ POL in your wallet (for liquidity + gas)  
✅ MetaMask connected to Polygon Mainnet  

---

## 🎯 Two Ways to Add Liquidity

### Option 1: Using the Script (Recommended for Large Amounts)

**Step 1: Configure the Amount**

Edit `scripts/add-liquidity.js` and set your desired amounts:

```javascript
const AETH_AMOUNT = ethers.parseEther("10000000"); // 10M AETH
const POL_AMOUNT = ethers.parseEther("5"); // 5 POL
```

**Recommended Initial Liquidity:**
- Start with 10-50M AETH
- Pair with 5-20 POL
- This sets your initial price

**Step 2: Review the Configuration**

```bash
cd smart-contract
node scripts/add-liquidity.js
```

This will show you:
- Amount of AETH and POL to add
- Initial price per AETH
- Estimated market cap

**Step 3: Uncomment and Execute**

If everything looks good:
1. Open `scripts/add-liquidity.js`
2. Uncomment lines 84-126 (the execution code)
3. Run again: `node scripts/add-liquidity.js`

---

### Option 2: Using QuickSwap UI (Easier for Beginners)

**Step 1: Go to QuickSwap**

🔗 **Direct Link:** https://quickswap.exchange/#/add/ETH/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e

**Step 2: Connect Wallet**

- Click "Connect Wallet"
- Select MetaMask
- Ensure you're on Polygon Mainnet

**Step 3: Enter Amounts**

Token 1: **POL**
- Enter amount (e.g., 5 POL)

Token 2: **AETH**
- QuickSwap will auto-detect the address
- Enter amount (e.g., 10,000,000 AETH)

**Step 4: Approve AETH**

- Click "Approve AETH"
- Confirm in MetaMask
- Wait for confirmation

**Step 5: Supply Liquidity**

- Click "Supply"
- Review the transaction
- Confirm in MetaMask
- Wait for confirmation

---

## 💰 Liquidity Recommendations

### Conservative Start (Low Risk)
- **AETH:** 5-10M (0.5-1% of supply)
- **POL:** 2-5 POL
- **Initial Price:** ~0.0000005 POL per AETH
- **Market Cap:** ~$250-500

### Moderate Start (Balanced)
- **AETH:** 20-50M (2-5% of supply)
- **POL:** 10-20 POL
- **Initial Price:** ~0.0000004 POL per AETH
- **Market Cap:** ~$2,000-4,000

### Aggressive Start (High Liquidity)
- **AETH:** 100-200M (10-20% of supply)
- **POL:** 50-100 POL
- **Initial Price:** ~0.0000005 POL per AETH
- **Market Cap:** ~$25,000-50,000

---

## 📊 Understanding the Numbers

### Initial Price Formula
```
Price per AETH = POL Amount ÷ AETH Amount
```

**Example:**
- 5 POL ÷ 10,000,000 AETH = 0.0000005 POL per AETH

### Market Cap Calculation
```
Market Cap = Price per AETH × Total Supply (1B)
```

**Example:**
- 0.0000005 × 1,000,000,000 = 500 POL (~$250 at $0.50/POL)

---

## ⚠️ Important Considerations

### Impermanent Loss
- When you add liquidity, you expose yourself to impermanent loss
- If AETH price changes significantly vs POL, you may lose value
- Learn more: [Impermanent Loss Explained](https://academy.binance.com/en/articles/impermanent-loss-explained)

### Liquidity Locking
- Consider locking liquidity using Team.Finance or Unicrypt
- Builds trust with investors
- Shows long-term commitment

### Slippage
- High slippage = low liquidity
- More liquidity = lower slippage = better trading experience
- Aim for <5% slippage for typical trades

---

## 🔗 After Adding Liquidity

### Share These Links

**Trading Link:**
```
https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
```

**Add Liquidity Link:**
```
https://quickswap.exchange/#/add/ETH/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
```

**Pool Analytics:**
```
https://info.quickswap.exchange/pair/[YOUR_PAIR_ADDRESS]
```

### Announce to Community

Share on:
- Twitter/X
- Telegram
- Discord
- Reddit

**Example Tweet:**
```
🚀 AETH is now LIVE on @QuickswapDEX!

💧 Liquidity Added
🔥 Trading Enabled
📊 Chart: [link]
💎 Buy: [link]

Contract: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e

#Polygon #DeFi #AETH
```

---

## 🛠️ Monitoring Tools

### QuickSwap Analytics
- Volume tracking
- Price charts
- Liquidity depth
- https://info.quickswap.exchange

### DexTools
- Advanced charting
- Holder analysis
- Transaction history
- https://www.dextools.io/app/polygon/

### PolygonScan
- Contract interactions
- Holder count
- Transaction volume
- https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e

---

## 💡 Pro Tips

1. **Start Small** - You can always add more liquidity later
2. **Monitor First Hour** - Watch for suspicious activity
3. **Set Price Alerts** - Use DexTools or DexScreener
4. **Gradual Increase** - Add liquidity in stages as volume grows
5. **Lock Liquidity** - Consider locking to build trust
6. **Provide Support** - Be active in community during launch
7. **Document Everything** - Keep records of all transactions

---

## 🆘 Troubleshooting

### "Insufficient Liquidity" Error
- Need more POL in wallet
- Check you have enough AETH

### "Transaction Failed"
- Increase gas limit
- Check approvals are complete
- Ensure trading is enabled

### Can't See AETH in QuickSwap
- Add token manually: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- Refresh the page
- Clear browser cache

### LP Tokens Not Showing
- Add LP token to MetaMask
- Find pair address on QuickSwap
- Import custom token

---

## 📞 Support Resources

- QuickSwap Discord: https://discord.gg/quickswap
- QuickSwap Docs: https://docs.quickswap.exchange
- Polygon Support: https://support.polygon.technology

---

## ✅ Checklist

Before adding liquidity:
- [ ] Have AETH tokens in wallet
- [ ] Have POL for liquidity + gas (~0.5 POL extra for fees)
- [ ] Decided on initial price/liquidity amount
- [ ] MetaMask connected to Polygon Mainnet
- [ ] Trading is enabled on contract
- [ ] Reviewed impermanent loss risks

After adding liquidity:
- [ ] LP tokens received
- [ ] Can see pool on QuickSwap
- [ ] Shared trading link with community
- [ ] Set up price alerts
- [ ] Monitoring transactions
- [ ] Consider liquidity locking

---

**🎉 Good luck with your token launch!**

Remember: Start conservative, monitor closely, and grow gradually as your community develops.
