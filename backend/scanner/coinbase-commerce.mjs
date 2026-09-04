// coinbase-commerce.mjs - Coinbase Commerce integration for Aetheron
// Handles charge creation and webhook verification for both Launchpad and Scanner

import express from 'express';
import crypto from 'node:crypto';
import { sendPaymentEmail } from './send-email.mjs';
import { requireOperator } from '../security.mjs';
const router = express.Router();
const COINBASE_API_KEY =
  process.env.COINBASE_COMMERCE_API_KEY || 'YOUR_COINBASE_COMMERCE_API_KEY';
const COINBASE_API_URL = 'https://api.commerce.coinbase.com/charges';

// Helper to create a charge
async function createCoinbaseCharge({
  name,
  description,
  amount,
  currency,
  metadata,
  redirect_url,
  cancel_url,
}) {
  const res = await fetch(COINBASE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': COINBASE_API_KEY,
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify({
      name,
      description,
      pricing_type: 'fixed_price',
      local_price: { amount: amount.toString(), currency },
      metadata,
      redirect_url,
      cancel_url,
    }),
  });
  if (!res.ok) throw new Error('Coinbase Commerce charge failed');
  return res.json();
}

// POST /api/create-coinbase-charge
router.post('/create-coinbase-charge', requireOperator, async (req, res) => {
  try {
    const {
      name,
      description,
      amount,
      currency,
      metadata,
      redirect_url,
      cancel_url,
    } = req.body;
    if (!name || !amount || !currency)
      return res.status(400).json({ error: 'Missing required fields' });
    const charge = await createCoinbaseCharge({
      name,
      description,
      amount,
      currency,
      metadata,
      redirect_url,
      cancel_url,
    });
    res.json(charge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/create-launchpad-charge
router.post('/create-launchpad-charge', requireOperator, async (req, res) => {
  try {
    const {
      name,
      symbol,
      supply,
      teamWallet,
      allocationPercent,
      logoUrl,
      website,
      description,
    } = req.body || {};
    if (!name || !symbol || !supply)
      return res.status(400).json({ error: 'Missing token details' });

    const charge = await createCoinbaseCharge({
      name: `Aetheron Token Launch: ${name} (${symbol})`,
      description: `Base ERC20 token launch via Aetheron Platform.\nSymbol: ${symbol}\nSupply: ${supply}\nTeam Wallet: ${teamWallet || 'default'}`,
      amount: '30',
      currency: 'USDC',
      metadata: {
        service: 'aetheron-launchpad',
        tokenName: name,
        symbol,
        supply: String(supply),
        teamWallet: teamWallet || '',
        allocationPercent: allocationPercent || '1',
        logoUrl: logoUrl || '',
        website: website || '',
        description: description || '',
      },
      redirect_url:
        process.env.LAUNCHPAD_REDIRECT_URL ||
        'https://aetrs.com/dashboard-enhanced.html?payment=success',
      cancel_url:
        process.env.LAUNCHPAD_CANCEL_URL ||
        'https://aetrs.com/dashboard-enhanced.html?payment=cancelled',
    });

    res.json(charge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function verifyCoinbaseWebhook(req, res, next) {
  const secret = (process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return res.status(503).json({
      error: 'Coinbase webhook verification is not configured.',
      code: 'WEBHOOK_SECRET_NOT_CONFIGURED',
    });
  }

  const signature = req.get('X-CC-Webhook-Signature') || '';
  const rawBody = req.rawBody;
  if (!Buffer.isBuffer(rawBody) || !/^[0-9a-fA-F]{64}$/.test(signature)) {
    return res.status(401).json({
      error: 'Invalid Coinbase webhook signature.',
      code: 'INVALID_WEBHOOK_SIGNATURE',
    });
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const provided = Buffer.from(signature, 'hex');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({
      error: 'Invalid Coinbase webhook signature.',
      code: 'INVALID_WEBHOOK_SIGNATURE',
    });
  }

  return next();
}

// Webhook endpoint for the legacy Coinbase Commerce charge API.
router.post('/coinbase-webhook', verifyCoinbaseWebhook, async (req, res) => {
  try {
    const event = req.body;
    if (
      event.type === 'charge:confirmed' &&
      event.data &&
      event.data.metadata &&
      event.data.metadata.email
    ) {
      await sendPaymentEmail({
        to: event.data.metadata.email,
        subject: 'Aetheron Payment Confirmed',
        text: `Your payment of ${event.data.pricing.local.amount} ${event.data.pricing.local.currency} was confirmed. Thank you!`,
      });
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
