// Payment history is disabled until authenticated, user-scoped storage exists.
// An operator-wide key plus a caller-controlled ?user= selector is not user authentication.
import express from 'express';
import { requireOperator } from '../security.mjs';

const router = express.Router();

router.get('/payment-history', requireOperator, (_req, res) => {
  res.status(503).json({
    error: 'Payment history is unavailable until authenticated user-scoped storage is configured.',
    code: 'PAYMENT_HISTORY_NOT_CONFIGURED',
  });
});

export default router;
