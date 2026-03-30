const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');

const app = express();
const rootDir = path.join(__dirname, '..');
const PORT = process.env.PORT || 4000;

const ADMIN_PASS_FILE = path.join(__dirname, 'admin.pass');
const TOKEN_REGISTRY_FILE = path.join(rootDir, 'scripts', 'token-registry.json');
const SENSITIVE_PREFIXES = [
  '/backend',
  '/scripts',
  '/smart-contract',
  '/node_modules',
  '/.git',
];

const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 10 * 60 * 1000;

const loginAttempts = Object.create(null);
let dashboardSettings = {};
let activityLog = [];

const logs = [
  {
    time: new Date().toISOString(),
    type: 'INFO',
    details: { message: 'Server initialized', port: PORT },
  },
];

const users = [
  { address: '0x1234...5678', balance: '1000 AETH', role: 'user', kyc: false },
  { address: '0xabcd...efgh', balance: '500 AETH', role: 'admin', kyc: true },
];

const stats = {
  totalUsers: 1250,
  totalTransactions: 45623,
  totalVolume: '2.5M AETH',
  networkStatus: 'Healthy',
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function isHexString(value, expectedLength) {
  return (
    typeof value === 'string' &&
    value.length === expectedLength &&
    /^[0-9a-f]+$/i.test(value)
  );
}

function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(':')) {
    return false;
  }

  const [salt, expectedHash] = storedValue.split(':');
  if (!isHexString(salt, 32) || !isHexString(expectedHash, 128)) {
    return false;
  }

  try {
    const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');

    return crypto.timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  } catch {
    return false;
  }
}

function loadAdminPasswordHash() {
  try {
    const storedHash = fs.readFileSync(ADMIN_PASS_FILE, 'utf8').trim();
    return storedHash || null;
  } catch {
    const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
    if (envHash) {
      return envHash;
    }

    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    if (envPassword) {
      return hashPassword(envPassword);
    }

    return null;
  }
}

function saveAdminPasswordHash(hash) {
  fs.writeFileSync(ADMIN_PASS_FILE, `${hash}\n`, 'utf8');
}

let adminPasswordHash = loadAdminPasswordHash();

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

function isBlocked(ip) {
  const attempt = loginAttempts[ip];
  if (!attempt) {
    return false;
  }

  if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
    return true;
  }

  if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
    delete loginAttempts[ip];
  }

  return false;
}

function recordLoginAttempt(ip, success) {
  if (success) {
    delete loginAttempts[ip];
    return;
  }

  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, blockedUntil: null };
  }

  loginAttempts[ip].count += 1;

  if (loginAttempts[ip].count >= MAX_ATTEMPTS) {
    loginAttempts[ip].blockedUntil = Date.now() + BLOCK_TIME_MS;
  }
}

function logEvent(type, details) {
  logs.push({
    time: new Date().toISOString(),
    type,
    details,
  });

  if (logs.length > 500) {
    logs.shift();
  }
}

function logActivity(user, action, details) {
  activityLog.push({
    time: new Date().toISOString(),
    user,
    action,
    details,
  });

  if (activityLog.length > 200) {
    activityLog.shift();
  }
}

function authMiddleware(req, res, next) {
  if (!adminPasswordHash) {
    return res.status(503).json({
      error: 'Admin authentication is not configured.',
      details: 'Set ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, or backend/admin.pass.',
    });
  }

  const ip = getClientIp(req);

  if (isBlocked(ip)) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Try again later.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let credentials = '';

  try {
    credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  } catch {
    recordLoginAttempt(ip, false);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const separatorIndex = credentials.indexOf(':');
  const username =
    separatorIndex >= 0 ? credentials.slice(0, separatorIndex) : credentials;
  const password = separatorIndex >= 0 ? credentials.slice(separatorIndex + 1) : '';

  if (username === 'admin' && verifyPassword(password, adminPasswordHash)) {
    recordLoginAttempt(ip, true);
    return next();
  }

  recordLoginAttempt(ip, false);
  return res.status(401).json({ error: 'Invalid credentials' });
}

function isSensitivePath(requestPath) {
  const normalizedPath = requestPath.replace(/\\/g, '/').toLowerCase();

  if (
    normalizedPath === '/admin.pass' ||
    normalizedPath.startsWith('/.env') ||
    normalizedPath.endsWith('/admin.pass')
  ) {
    return true;
  }

  return SENSITIVE_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

function getTokenRegistry() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_REGISTRY_FILE, 'utf8'));
  } catch {
    return [
      {
        symbol: 'AETH',
        name: 'Aetheron',
        chainId: 137,
      },
    ];
  }
}

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  if (isSensitivePath(req.path)) {
    return res.status(404).json({ error: 'Not found' });
  }

  return next();
});

app.use(
  express.static(rootDir, {
    dotfiles: 'ignore',
    index: false,
  }),
);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin-dashboard.html'));
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/tokens', (req, res) => {
  res.json(getTokenRegistry());
});

app.post('/api/logs', (req, res) => {
  logEvent('INFO', { action: 'client_log', payload: req.body });
  res.json({ success: true });
});

app.get('/settings/export', authMiddleware, (req, res) => {
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="dashboard-settings.json"',
  );
  res.json(dashboardSettings);
});

app.post('/settings/import', authMiddleware, (req, res) => {
  dashboardSettings = req.body || {};
  logEvent('INFO', { action: 'settings_imported' });
  res.json({ success: true });
});

app.post('/admin/reset-password', authMiddleware, (req, res) => {
  const { newPassword } = req.body || {};
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 6 characters.' });
  }

  adminPasswordHash = hashPassword(newPassword);
  saveAdminPasswordHash(adminPasswordHash);
  logEvent('INFO', { action: 'password_reset', by: 'admin' });

  return res.json({ success: true, message: 'Password updated.' });
});

app.get('/stats', authMiddleware, (req, res) => {
  res.json(stats);
});

app.get('/users', authMiddleware, (req, res) => {
  res.json(users);
});

app.post('/users/add', authMiddleware, (req, res) => {
  const { address, balance } = req.body || {};
  if (!address || !balance) {
    return res.status(400).json({ error: 'Address and balance are required.' });
  }

  users.push({ address, balance, role: 'user', kyc: false });
  logEvent('INFO', { action: 'user_added', address, balance });
  logActivity('admin', 'add_user', { address, balance });
  res.json({ success: true });
});

app.post('/users/remove', authMiddleware, (req, res) => {
  const { address } = req.body || {};
  const index = users.findIndex((user) => user.address === address);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(index, 1);
  logEvent('INFO', { action: 'user_removed', address });
  logActivity('admin', 'remove_user', { address });
  res.json({ success: true });
});

app.post('/users/role', authMiddleware, (req, res) => {
  const { address, role } = req.body || {};
  const user = users.find((entry) => entry.address === address);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = role;
  logEvent('INFO', { action: 'role_updated', address, role });
  logActivity('admin', 'update_role', { address, role });
  res.json({ success: true });
});

app.post('/users/kyc', authMiddleware, (req, res) => {
  const { address, kyc } = req.body || {};
  const user = users.find((entry) => entry.address === address);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.kyc = Boolean(kyc);
  logEvent('SUCCESS', { action: 'kyc_updated', address, kyc: Boolean(kyc) });
  logActivity('admin', 'update_kyc', { address, kyc: Boolean(kyc) });
  res.json({ success: true });
});

app.get('/activity-log', authMiddleware, (req, res) => {
  res.json(activityLog.slice(-100));
});

app.get('/logs', authMiddleware, (req, res) => {
  res.json(logs.slice(-50));
});

app.get('/logs/export', authMiddleware, (req, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';

  if (format === 'csv') {
    const csv = ['time,type,details']
      .concat(
        logs.map((entry) => {
          const details = JSON.stringify(entry.details).replace(/"/g, '""');
          return `${entry.time},${entry.type},"${details}"`;
        }),
      )
      .join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename="aetheron-logs.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  }

  res.setHeader('Content-Disposition', 'attachment; filename="aetheron-logs.json"');
  return res.json(logs);
});

app.get('/coins', authMiddleware, (req, res) => {
  res.json(getTokenRegistry());
});

app.post('/coins/mint', authMiddleware, (req, res) => {
  const { symbol, amount } = req.body || {};
  logEvent('SUCCESS', { action: 'coin_minted', symbol, amount });
  res.json({ success: true });
});

app.post('/coins/burn', authMiddleware, (req, res) => {
  const { symbol, amount } = req.body || {};
  logEvent('INFO', { action: 'coin_burned', symbol, amount });
  res.json({ success: true });
});

app.get('/transactions', authMiddleware, (req, res) => {
  res.json([
    {
      id: 1,
      from: '0x1234',
      to: '0xabcd',
      amount: 100,
      symbol: 'AETH',
      time: new Date().toISOString(),
    },
    {
      id: 2,
      from: '0xabcd',
      to: '0x1234',
      amount: 50,
      symbol: 'AETH',
      time: new Date().toISOString(),
    },
  ]);
});

app.post('/transactions/send', authMiddleware, (req, res) => {
  const { from, to, amount, symbol } = req.body || {};
  logEvent('SUCCESS', {
    action: 'transaction_sent',
    from,
    to,
    amount,
    symbol,
  });
  res.json({ success: true });
});

app.get('/reputation/:address', authMiddleware, (req, res) => {
  res.json({
    address: req.params.address,
    reputation: Math.floor(Math.random() * 100),
    level: 'Trusted',
  });
});

app.get('/education/:address', authMiddleware, (req, res) => {
  res.json({
    address: req.params.address,
    coursesCompleted: Math.floor(Math.random() * 10),
    certificates: ['Blockchain Basics', 'DeFi Fundamentals'],
  });
});

app.get('/chain', authMiddleware, (req, res) => {
  res.json({
    height: Math.floor(Math.random() * 1_000_000),
    hash: `0x${crypto.randomBytes(32).toString('hex')}`,
    transactions: Math.floor(Math.random() * 1000),
  });
});

async function mountApiRouters() {
  const routerModules = [
    './scanner/scanner-api.mjs',
    './scanner/launchpad-api.mjs',
    './scanner/coinbase-commerce.mjs',
    './scanner/payment-history-backend.mjs',
    './scanner/all-payments-backend.mjs',
  ];

  for (const modulePath of routerModules) {
    try {
      const module = await import(modulePath);
      const router = module.default || module.router || module;
      app.use('/api', router);
      logEvent('INFO', { action: 'router_mounted', modulePath });
    } catch (error) {
      console.warn(`Skipping API module ${modulePath}: ${error.message}`);
      logEvent('WARN', {
        action: 'router_skipped',
        modulePath,
        error: error.message,
      });
    }
  }
}

async function startServer() {
  await mountApiRouters();

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(path.join(rootDir, 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    logEvent('ERROR', { message: err.message, path: req.path });
    res.status(500).json({ error: 'Internal server error' });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.listen(PORT, () => {
    logEvent('SUCCESS', {
      message: 'Aetheron backend server started',
      port: PORT,
    });

    console.log(`Aetheron backend running on http://localhost:${PORT}`);
    console.log(`Admin dashboard available at http://localhost:${PORT}/admin`);

    if (!adminPasswordHash) {
      console.warn(
        'Admin authentication is not configured. Set ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, or backend/admin.pass.',
      );
    }
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});

module.exports = app;
