# 💰 Aetheron Presale Guide

## ⚠️ Current Status (Jan 27, 2026)

- **Deployment Script:** Updated with correct AETH address (`0xAb5...71e`).
- **Blocker:** Deployer wallet has **0 MATIC**. Needs funding.

## 🛑 Immediate Action Required

**Fund the Deployer Wallet:**

- **Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **Network:** Polygon Mainnet
- **Required:** ~2 MATIC

---

## 1. Deploy the Presale Contract

Once funded, deploy the contract that will collect MATIC and give out AETH.

1. Open a terminal in `smart-contract/` folder.
2. Run the deployment script:

   ```bash
   npx hardhat run scripts/deploy-presale.js --network polygon
   ```

3. **COPY** the new contract address output (e.g., `0x123...`).

## 2. Update Frontend

1. Open `presale.js` in the root folder.
2. Find line 3:

   ```javascript
   const PRESALE_CONTRACT_ADDRESS = "REPLACE_WITH_DEPLOYED_ADDRESS"; 
   ```

3. Replace the text with your new address.

## 3. Fund the Contract

The contract needs AETH tokens to give to buyers.

1. Open your MetaMask.
2. Select **AETH** token.
3. Click **Send**.
4. Paste the **Presale Contract Address**.
5. Send a large amount (e.g., **5,000,000 AETH**).
   - Note: This is the specific supply available for presale.

## 4. Market the Presale

1. Direct users to `https://your-site.com/presale.html`.
2. Tell them: "Use MATIC to buy AETH early before listing!"
3. **Wait** until you collect enough MATIC (e.g., 500-1000 MATIC).

## 5. Withdraw & Add Liquidity (CRITICAL)

Once the presale is over, you must take the MATIC raised and put it into QuickSwap.

**To Withdraw MATIC:**
You can use PolygonScan to interact *or* we can create a quick script.
- **Via PolygonScan:**
    1. Go to your Contract Address on PolygonScan.
    2. Click "**Contract**" -> "**Write Contract**" -> "**Connect to Web3**".
    3. Click `withdrawFunds`.
    4. Confirm transaction.
    5. The MATIC returns to your wallet.

**To Withdraw Unsold Tokens:**
- Click `withdrawTokens` on PolygonScan and enter the remaining amount.

## 6. Launch on QuickSwap

Now that you have the MATIC from the presale and your remaining Tokens:

1. Go to QuickSwap.
2. Add Liquidity (MATIC + AETH).
3. **Launch Complete!**
