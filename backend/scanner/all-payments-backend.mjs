// all-payments-backend.mjs - Express route for admin to view all payments
import express from 'express';
import fs from 'fs';
import path from 'path';
import { requireOperator } from '../security.mjs';

const router = express.Router();
const HISTORY_FILE = path.join(path.resolve(), 'payment-history.json');

// GET /api/all-payments
router.get('/all-payments', requireOperator, (req, res) => {
  // TODO: Add admin authentication in production
  if (!fs.existsSync(HISTORY_FILE)) return res.json({ payments: [] });
  const all = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  // Flatten all user histories into a single array
  const payments = Object.entries(all).flatMap(([user, arr]) =>
    arr.map((p) => ({ ...p, user })),
  );
  res.json({ payments });
});

export default router;
