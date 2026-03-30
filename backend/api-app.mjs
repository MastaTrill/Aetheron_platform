import express from 'express';

import scannerApi from './scanner/scanner-api.mjs';
import launchpadApi from './scanner/launchpad-api.mjs';
import coinbaseCommerceApi from './scanner/coinbase-commerce.mjs';
import paymentHistoryApi from './scanner/payment-history-backend.mjs';
import allPaymentsApi from './scanner/all-payments-backend.mjs';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://mastatrill.github.io',
  'https://aetheronplatform.github.io',
  'https://aetheron-platform.pages.dev',
  'https://vercel-node-app-1.vercel.app',
  'https://aetheron.vercel.app',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:4173',
];

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.ALLOWED_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) || [];

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
}

function resolveCorsOrigin(requestOrigin, allowedOrigins) {
  if (!requestOrigin) {
    return '';
  }

  if (allowedOrigins.has(requestOrigin)) {
    return requestOrigin;
  }

  return '';
}

const apiApp = express();
const allowedOrigins = getAllowedOrigins();

apiApp.use(express.json());

apiApp.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

apiApp.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'aetheron-backend-api',
    timestamp: new Date().toISOString(),
  });
});

apiApp.use(scannerApi);
apiApp.use(launchpadApi);
apiApp.use(coinbaseCommerceApi);
apiApp.use(paymentHistoryApi);
apiApp.use(allPaymentsApi);

apiApp.use((req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.path,
  });
});

export default apiApp;
