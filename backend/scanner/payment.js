// payment.js - Simple Stripe payment intent endpoint for scanner
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_xxx'); // Replace with real key in prod

// POST /api/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  const { amount, currency, metadata } = req.body;
  if (!amount || !currency)
    return res.status(400).json({ error: 'Amount and currency required' });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: metadata || {},
      description: 'Aetheron Token Scanner Full Report',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
