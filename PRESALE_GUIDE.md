# Aetheron Presale Guide

## Current Status

- Presale frontend is live at `https://aetrs.com/presale.html`.
- The frontend stays disabled until `presale-config.js` contains a real Polygon presale contract address.
- The deploy script generates `presale-config.js` after a successful deployment.

## 1. Pre-Deploy Checklist

- Fund the deployer wallet on Polygon with enough POL/MATIC for deployment and the `setExcludedFromTax` transaction.
- Confirm the deployer owns or can administer the AETH token, because the deploy script must exclude the presale contract from token tax.
- Confirm the treasury address is correct: `0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa`.
- Run tests before deploying:

```bash
cd smart-contract
npm run compile
npm test
```

## 2. Deploy the Presale Contract

From `smart-contract/`:

```bash
npm run deploy:presale
```

Optional environment overrides:

```bash
PRESALE_SOFT_CAP_MATIC=5000
PRESALE_HARD_CAP_MATIC=33333.333333333333333333
PRESALE_MIN_MATIC=0.1
PRESALE_MAX_MATIC=1000
PRESALE_RATE=1000
PRESALE_START_DELAY_SECONDS=3600
PRESALE_DURATION_SECONDS=1209600
npm run deploy:presale
```

The script writes:

- `presale-config.js` for the website.
- `smart-contract/deployments/presale-polygon.json` for deployment records.

## 3. Fund the Presale Contract

Send the sale allocation of AETH to the deployed presale contract address. The contract will reject purchases if it does not hold enough AETH to cover tokens owed.

## 4. Publish the Website

Deploy the updated static files, including:

- `presale.html`
- `presale.js`
- `presale-config.js`

After publishing, verify:

- `https://aetrs.com/presale-config.js` contains the deployed contract address.
- `https://aetrs.com/presale.html` shows that same address.
- Wallet connection switches to Polygon and reads the live presale data.

## 5. Finalize or Refund

If the soft cap is met after the sale window closes, call:

- `finalize()`
- Contributors call `claimTokens()`
- Owner calls `withdrawFunds()`
- Owner calls `withdrawUnsoldTokens()`

If the sale is cancelled or misses soft cap:

- Contributors call `claimRefund()`
- Owner calls `withdrawUnsoldTokens()` to recover tokens that are no longer reserved.
