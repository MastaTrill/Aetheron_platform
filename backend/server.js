// Simple Express server to mount scanner and launchpad APIs
const express = require('express');
const bodyParser = require('body-parser');

const scannerApi = require('./scanner/scanner-api');
const launchpadApi = require('./scanner/launchpad-api');
const paymentApi = require('./scanner/payment');
const paymentLaunchpadApi = require('./scanner/payment-launchpad');

const path = require('path');
const app = express();
app.use(bodyParser.json());

// Serve static files from the root project directory
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api', scannerApi);
app.use('/api', launchpadApi);
app.use('/api', paymentApi);
app.use('/api', paymentLaunchpadApi);

// Fallback: serve index.html for unknown (non-API) routes (SPA support)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Aetheron backend running on port ${PORT}`);
});
