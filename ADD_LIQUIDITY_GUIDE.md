# 💧 Adding Liquidity on Base Mainnet (Aerodrome / Uniswap V3) — Complete Guide

This guide details the procedure for establishing canonical AETH liquidity pools on Base Mainnet (Chain ID 8453), pairing AETH with WETH.

---

## 📋 Prerequisites

- [x] **Canonical AETH Token**: Deployed & verified on Base Mainnet (`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`)
- [x] **On-Chain Trading Enabled**: Verified on-chain (`tradingEnabled == true`)
- [ ] **Pool Inventory**: 10M–50M AETH in deployer/treasury wallet
- [ ] **Paired Capital**: 0.1–1.0 ETH in deployer wallet for initial liquidity and gas
- [ ] **Launch Authorization Gate**: Issue #219 approval & explicit `CONFIRM_ADD_LIQUIDITY` confirmation

---

## 🎯 Two Options to Provision Liquidity

### Option 1: Automated Script (Aerodrome Router on Base)

The repository provides a dedicated, write-gated script that verifies chain ID, balances, approvals, and slippage before broadcasting:

1. **Preflight Dry Run (Default)**:
   ```bash
   node smart-contract/scripts/base-add-liquidity.mjs --dry-run
   ```
   *Validates on-chain balances, router approvals, and calculates implied initial price without broadcasting.*

2. **Live Execution**:
   ```bash
   PRIVATE_KEY=<deployer_key> \
   CONFIRM_ADD_LIQUIDITY=CONFIRM_ADD_LIQUIDITY_BASE \
   LIVE_ACTION=true \
   CONFIRM_LIVE_ACTION=CONFIRM_ADD_LIQUIDITY \
   LIQUIDITY_AMOUNT_TOKEN=10000000 \
   LIQUIDITY_AMOUNT_ETH=0.1 \
   node smart-contract/scripts/base-add-liquidity.mjs --execute
   ```

---

### Option 2: Using DEX Web UI (Aerodrome / Uniswap on Base)

**Step 1: Go to DEX Interface**

🔗 **Aerodrome:** https://aerodrome.finance/deposit  
🔗 **Uniswap Base:** https://app.uniswap.org/positions/create/v3?chain=base

**Step 2: Connect Wallet**

- Click "Connect Wallet"
- Select MetaMask or Coinbase Wallet
- Ensure you are connected to **Base Mainnet** (`8453`)

**Step 3: Select Tokens and Enter Amounts**

- **Token 1**: `ETH` (or `WETH`: `0x4200000000000000000000000000000000000006`)
- **Token 2**: `AETH` (`0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`)
- Enter paired amounts (e.g., `10,000,000 AETH` and `0.1 ETH`)

**Step 4: Approve & Deposit**

- Approve AETH token spend
- Confirm "Supply Liquidity" transaction
- Wait for Base block confirmation

---

## 💰 Liquidity Recommendations (Base Mainnet)

### Conservative Initial Pool
- **AETH**: 10,000,000 AETH (1% of total supply)
- **ETH**: 0.05–0.10 ETH
- **Initial Price**: ~0.00000001 ETH per AETH ($0.000025 at $2,500/ETH)
- **Implied Market Cap**: 10 ETH (~$25,000)

### Moderate Launch Pool
- **AETH**: 25,000,000–50,000,000 AETH (2.5–5% of supply)
- **ETH**: 0.25–0.50 ETH
- **Initial Price**: ~0.00000001 ETH per AETH
- **Implied Market Cap**: 10 ETH (~$25,000)

---

## 📊 Understanding the Numbers

### Initial Price Formula
```
Price per AETH = ETH Amount ÷ AETH Amount
```

**Example:**
- 0.1 ETH ÷ 10,000,000 AETH = 0.00000001 ETH per AETH

### Market Cap Calculation
```
Market Cap = Price per AETH × Total Supply (1,000,000,000 AETH)
```

**Example:**
- 0.00000001 ETH × 1,000,000,000 = 10 ETH (~$25,000)

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

### Public Links

**Trading & Pool Links:**
- **Aerodrome Pool:** https://aerodrome.finance/deposit
- **DexScreener (Base):** https://dexscreener.com/base/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e
- **BaseScan Token Tracker:** https://basescan.org/token/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e

### Announce to Community

Share on:
- Twitter/X (@Aetheron)
- Telegram & Discord

**Example Announcement:**
```
🚀 $AETH is now LIVE on Aerodrome Base!

💧 Initial Liquidity Seeded
🔥 Trading Enabled on Base Mainnet
📊 DexScreener: https://dexscreener.com/base/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e
💎 Contract: 0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e

#Base #DeFi #AETH #Aetheron
```

---

## 🛠️ Monitoring Tools

### DexScreener (Base)
- Real-time chart & orderbook
- Liquidity and volume depth
- https://dexscreener.com/base/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e

### BaseScan Block Explorer
- On-chain transfer events
- Holder distribution
- Contract interactions
- https://basescan.org/token/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e

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
