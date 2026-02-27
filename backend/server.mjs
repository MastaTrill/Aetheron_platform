// Simple Express server to mount scanner and launchpad APIs
import express from 'express';
import bodyParser from 'body-parser';

import scannerApi from './scanner/scanner-api.mjs';
import launchpadApi from './scanner/launchpad-api.mjs';
import coinbaseCommerceApi from './scanner/coinbase-commerce.mjs';
import paymentHistoryApi from './scanner/payment-history-backend.mjs';
import allPaymentsApi from './scanner/all-payments-backend.mjs';

import path from 'path';
const app = express();
app.use(bodyParser.json());

// Serve static files from the root project directory
app.use(express.static(path.join(path.resolve(), '..')));

// API routes
app.use('/api', scannerApi);
app.use('/api', launchpadApi);
app.use('/api', coinbaseCommerceApi);
app.use('/api', paymentHistoryApi);
app.use('/api', allPaymentsApi);

// Fallback: serve index.html for unknown (non-API) routes (SPA support)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(path.resolve(), '..', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Aetheron backend running on port ${PORT}`);
});
