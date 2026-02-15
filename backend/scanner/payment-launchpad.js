// payment-launchpad.js - Stripe payment for Token Launchpad
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_xxx'); // Replace with real key in prod

// POST /api/create-launchpad-payment
router.post('/create-launchpad-payment', async (req, res) => {
  const { amount, currency, metadata } = req.body;
  if (!amount || !currency)
    return res.status(400).json({ error: 'Amount and currency required' });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: metadata || {},
      description: 'Aetheron Token Launchpad Fee',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
