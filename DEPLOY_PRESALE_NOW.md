# 🚀 DEPLOY AETHERON PRESALE RIGHT NOW

**Status as of July 16, 2026:** Contract source is fully fixed and ready. Frontend is live but waiting for a real mainnet presale contract.

---

## ✅ What I Already Did For You

- Fixed `AetheronPresale.sol` → full V2 with treasury routing (matches deploy script)
- Confirmed deploy script works with the new source
- Confirmed treasury address: `0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa`
- Confirmed AETH token: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`

---

## 1. Deploy (Copy-Paste This)

```bash
cd smart-contract
git pull origin main
npm install
npm run compile

# Make sure your .env has:
# PRIVATE_KEY=0x... (the wallet that owns the AETH token)
# POLYGON_RPC_URL=https://polygon-rpc.com

npm run deploy:presale
```

**Expected output:**
```
✅ Presale Deployed to: 0xYourNewAddress
Start Time: ...
End Time: ...
✅ Presale contract excluded from tax
```

Then it will auto-write:
- `../presale-config.js`
- `deployments/presale-polygon.json`

---

## 2. Fund the Presale Contract (Critical)

After deployment, **immediately** send AETH to the new contract address.

### Recommended Funding Amount

| Goal                    | AETH to Send     | Notes                          |
|-------------------------|------------------|--------------------------------|
| Soft cap only (5k MATIC)| 5,000,000 AETH  | Minimum viable                 |
| Full hard cap           | 33,333,000 AETH | Recommended for max raise      |
| Safe buffer             | 35,000,000 AETH | Best practice                  |

**How to send:**
1. From the wallet that holds AETH (treasury or owner wallet)
2. On PolygonScan or MetaMask / Coinbase Wallet
3. Send exactly to the new presale address printed by the script
4. Confirm the contract has enough balance before the start time

The contract **will reject buys** if it doesn't hold enough AETH for the purchase.

---

## 3. Update Website (After Deploy)

```bash
# From repo root
git add presale-config.js smart-contract/deployments/presale-polygon.json
git commit -m "Live AetheronPresaleV2 mainnet deployment + config"
git push origin main
```

GitHub Pages / your host will pick it up. Then check:
- https://aetrs.com/presale-config.js → should show the new address
- https://aetrs.com/presale.html → should go live

---

## 4. My Strong Recommendations

### Parameters (I recommend keeping defaults or adjusting slightly)

| Parameter              | Default          | My Recommendation                  | Why |
|------------------------|------------------|------------------------------------|-----|
| Rate                   | 1000 AETH/MATIC | **Keep 1000**                     | Matches site marketing |
| Soft Cap               | 5,000 MATIC     | **3,000 – 5,000 MATIC**           | Realistic first raise |
| Hard Cap               | ~33,333 MATIC   | **Keep or lower to 15k–20k**      | Don't over-promise |
| Min Contribution       | 0.1 MATIC       | Keep                              | Dust protection |
| Max Contribution       | 1,000 MATIC     | **500 – 1000**                    | Fair distribution |
| Start Delay            | 1 hour          | **2–4 hours**                     | Give time to fund + announce |
| Duration               | 14 days         | **7–10 days**                     | Urgency + less fatigue |

### Strategy Recommendations

1. **Do the real presale first**, then add liquidity after it ends (or after softcap is hit). This creates real demand and price discovery.
2. **Announce on X immediately** after funding: “Presale is live at aetrs.com/presale.html – 1 MATIC = 1000 AETH”
3. **Keep softcap modest** so you can finalize and claim success even if raise is small.
4. **Transfer ownership of the presale contract** to the treasury multisig after it starts receiving funds (optional but cleaner).
5. After finalize:
   - Call `withdrawFunds()` → MATIC goes to treasury
   - Call `withdrawUnsoldTokens()` if any left
   - Add remaining AETH + raised MATIC as liquidity on QuickSwap
6. Then enable trading on the main token if not already, and list on DexScreener / CMC / CoinGecko.

### Risk Notes
- Liquidity is currently near zero → any early DEX buys will have terrible slippage.
- The homepage currently markets “presale” but points to QuickSwap. Once the real presale is live, update the homepage CTA to point to `/presale.html`.
- Make sure the deployer wallet has enough POL for gas + the tax-exclude transaction.

---

## Ready Checklist

- [ ] Wallet funded with POL (gas)
- [ ] Wallet owns AETH token (for setExcludedFromTax)
- [ ] .env has correct PRIVATE_KEY
- [ ] `npm run compile` succeeds
- [ ] Run `npm run deploy:presale`
- [ ] Fund new contract with AETH
- [ ] Push updated `presale-config.js`
- [ ] Announce

---

**Run the deploy command and paste the full output here.**  
I will immediately:
1. Confirm the new address
2. Calculate exact AETH to send
3. Help you update the site
4. Draft the X announcement
5. Update FINAL_STATUS.md and CONTRACT_ADDRESSES.md

You're one command away from a real, live, hardened presale.  
Go. 🚀
