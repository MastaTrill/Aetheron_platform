// all-payments-backend.js - Express route for admin to view all payments
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'payment-history.json');

// GET /api/all-payments
router.get('/all-payments', (req, res) => {
  // TODO: Add admin authentication in production
  if (!fs.existsSync(HISTORY_FILE)) return res.json({ payments: [] });
  const all = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  // Flatten all user histories into a single array
  const payments = Object.entries(all).flatMap(([user, arr]) =>
    arr.map(p => ({ ...p, user }))
  );
  res.json({ payments });
});

module.exports = router;
