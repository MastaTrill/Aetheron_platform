// payment-history-backend.mjs - Express route for user payment history
import express from 'express';
import fs from 'fs';
import path from 'path';
const router = express.Router();

const HISTORY_FILE = path.join(path.resolve(), 'payment-history.json');

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

export default router;
