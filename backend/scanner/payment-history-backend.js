// payment-history-backend.js - Express route for user payment history
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// For demo: store payment history in a JSON file (replace with DB in production)
const HISTORY_FILE = path.join(__dirname, 'payment-history.json');

function getUserHistory(userId) {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  const all = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  return all[userId] || [];
}

// GET /api/payment-history
router.get('/payment-history', (req, res) => {
  // TODO: Replace with real user auth/session
  const userId = req.query.user || 'demo';
  const history = getUserHistory(userId);
  res.json({ history });
});

module.exports = router;
