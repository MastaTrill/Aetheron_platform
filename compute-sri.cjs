// Compute Subresource Integrity (SRI) hashes for external CDN assets
// Usage: node compute-sri.js

const https = require('https');
const { createHash } = require('crypto');

const urls = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js',
];

function computeSRI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // handle redirects
        return resolve(computeSRI(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const hash = createHash('sha384');
      res.on('data', (chunk) => hash.update(chunk));
      res.on('end', () => {
        const integrity = 'sha384-' + hash.digest('base64');
        resolve({ url, integrity });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  for (const url of urls) {
    try {
      const { integrity } = await computeSRI(url);
      console.log(`${url} ${integrity}`);
    } catch (err) {
      console.error(`Failed to compute SRI for ${url}:`, err.message);
      process.exitCode = 1;
    }
  }
})();
