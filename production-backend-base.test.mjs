import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANONICAL_AETH = '0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e';
const BASE_CHAIN_ID = 8453;

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readLower(relativePath) {
  return read(relativePath).toLowerCase();
}

const launchpadApi = read('backend/scanner/launchpad-api.mjs');
assert.match(launchpadApi, /BASE_RPC_URL/, 'launchpad API must use BASE_RPC_URL');
assert.match(launchpadApi, /8453/, 'launchpad API must pin Base Mainnet chain ID 8453');
assert.doesNotMatch(
  launchpadApi,
  /POLYGON_RPC_URL|polygon-rpc\.com|Token deployed to Polygon|Polygon RPC/i,
  'launchpad API must not expose Polygon deployment configuration',
);

const deployToken = read('backend/scanner/deploy-token.mjs');
assert.match(
  deployToken,
  /expectedChainId/,
  'token deployment utility must verify an expected chain ID before deployment',
);
assert.match(
  deployToken,
  /getNetwork\(\)/,
  'token deployment utility must read the connected RPC network before deployment',
);

const nftApi = read('backend/scanner/nft-api.mjs');
assert.match(nftApi, /BASE_RPC_URL/, 'NFT API must use BASE_RPC_URL');
assert.match(nftApi, /8453/, 'NFT API must pin Base Mainnet chain ID 8453');
assert.doesNotMatch(
  nftApi,
  /POLYGON_RPC_URL|polygon-rpc\.com/i,
  'NFT API must not silently use Polygon',
);

const dashboardHtml = read('dashboard-enhanced.html');
assert.doesNotMatch(dashboardHtml, /Launch a Polygon token/i, 'public launchpad copy must be Base-current');
assert.match(dashboardHtml, /Launch a Base token/i, 'public launchpad must identify Base');

const dashboardJs = read('dashboard-enhanced.js');
assert.doesNotMatch(dashboardJs, /polygonscan\.com|Open in PolygonScan/i, 'launch result must not link to PolygonScan');
assert.match(dashboardJs, /basescan\.org\/token\//i, 'launch result must link to BaseScan');

const apiApp = read('backend/api-app.mjs');
assert.match(apiApp, /https:\/\/aetrs\.com/, 'backend CORS allowlist must include the production custom domain');

const vercel = JSON.parse(read('backend/vercel.json'));
assert.equal(vercel.builds?.[0]?.src, 'vercel-handler.mjs', 'Vercel must use the CORS-aware API handler');
assert.equal(vercel.routes?.[0]?.dest, '/vercel-handler.mjs', 'Vercel routes must target the API handler');

const registryPath = path.join(ROOT, 'scripts', 'token-registry.json');
assert.ok(fs.existsSync(registryPath), 'canonical token registry must exist so the backend never falls back to stale chain data');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
assert.ok(Array.isArray(registry) && registry.length > 0, 'token registry must contain at least AETH');
const aeth = registry.find((entry) => String(entry.symbol).toUpperCase() === 'AETH');
assert.ok(aeth, 'token registry must contain AETH');
assert.equal(Number(aeth.chainId), BASE_CHAIN_ID, 'AETH registry chainId must be Base Mainnet 8453');
assert.equal(String(aeth.address).toLowerCase(), CANONICAL_AETH, 'AETH registry address must match canonical Base deployment');

console.log('Production backend and public launchpad are pinned to canonical Base deployment truth.');
