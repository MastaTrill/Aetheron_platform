// To enable Coinbase Commerce API routes, add the following to your main Express app (e.g., backend/index.js or backend/app.js):

const coinbaseCommerce = require('./scanner/coinbase-commerce');
app.use('/api', coinbaseCommerce);

// This will expose POST /api/create-coinbase-charge for both Launchpad and Scanner payments.