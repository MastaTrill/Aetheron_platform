import express from 'express';

import scannerApi from './scanner/scanner-api.mjs';
import launchpadApi from './scanner/launchpad-api.mjs';
import nftApi from './scanner/nft-api.mjs';
import coinbaseCommerceApi from './scanner/coinbase-commerce.mjs';
import paymentHistoryApi from './scanner/payment-history-backend.mjs';
import allPaymentsApi from './scanner/all-payments-backend.mjs';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://aetrs.com',
  'https://www.aetrs.com',
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

apiApp.disable('x-powered-by');
apiApp.use(express.json({
  limit: '1mb',
  verify: (req, res, buffer) => {
    if (req.path === '/coinbase-webhook') {
      req.rawBody = Buffer.from(buffer);
    }
  },
}));

apiApp.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

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
    network: 'base',
    chainId: 8453,
    timestamp: new Date().toISOString(),
  });
});

apiApp.get(['/sentinel/health', '/api/sentinel/health'], (req, res) => {
  res.json({
    status: 'ok',
    systemHealthy: true,
    killSwitchActive: false,
    activePolicyPack: 'v0.2.1-conservative',
    pqScheme: 'RealDilithiumBackend(dilithium_py.Dilithium2)',
    network: 'base',
    chainId: 8453,
    testnetContracts: {
      chainId: 84532,
      sentinel: '0x71C95911E9a5D330f4D621842EC243EE1343292e',
      l3Relay: '0x94099942864EA81cCF197E9D71ac53310b1468D8',
    },
    timestamp: new Date().toISOString(),
  });
});

apiApp.post(['/sentinel/evaluate', '/api/sentinel/evaluate'], (req, res) => {
  const body = req.body || {};
  const amount = Number(body.amount || 0);
  const liquidity = Math.max(Number(body.available_liquidity || 100000), 1e-9);
  const anomaly = Math.min(Math.max(Number(body.anomaly_score || 0), 0), 1);
  const drainRatio = Math.min(amount / liquidity, 1.5);
  const riskScore = Number(Math.min(0.5 * drainRatio + 0.5 * anomaly, 1).toFixed(4));
  const action =
    drainRatio > 0.9 || anomaly > 0.95 || riskScore >= 0.6
      ? 'BLOCK'
      : riskScore >= 0.35
        ? 'THROTTLE'
        : 'ALLOW';

  res.json({
    action,
    risk_score: riskScore,
    reasons: action === 'ALLOW' ? [] : ['guardrail_threshold_triggered'],
    controls: action === 'BLOCK' ? ['pause_bridge'] : action === 'THROTTLE' ? ['add_time_delay'] : ['monitor'],
    chainId: 8453,
  });
});

apiApp.use(scannerApi);
apiApp.use(launchpadApi);
apiApp.use('/nft', nftApi);
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
