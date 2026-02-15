// coinbase-commerce.js - Coinbase Commerce integration for Aetheron
// Handles charge creation and webhook verification for both Launchpad and Scanner

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
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
router.post('/create-coinbase-charge', async (req, res) => {
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

// Webhook endpoint for Coinbase Commerce (to be set in Coinbase dashboard)
const { sendPaymentEmail } = require('./send-email');

// Example webhook handler (Coinbase Commerce will POST here)
router.post(
  '/coinbase-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // NOTE: In production, verify the signature header for security!
    try {
      const event = JSON.parse(req.body.toString());
      if (
        event.type === 'charge:confirmed' &&
        event.data &&
        event.data.metadata &&
        event.data.metadata.email
      ) {
        // Send confirmation email
        await sendPaymentEmail({
          to: event.data.metadata.email,
          subject: 'Aetheron Payment Confirmed',
          text: `Your payment of ${event.data.pricing.local.amount} ${event.data.pricing.local.currency} was confirmed. Thank you!`,
          html: `<p>Your payment of <b>${event.data.pricing.local.amount} ${event.data.pricing.local.currency}</b> was confirmed. Thank you for supporting Aetheron!</p>`,
        });
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

module.exports = router;
