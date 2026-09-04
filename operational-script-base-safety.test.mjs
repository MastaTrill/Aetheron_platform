import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  assert.ok(fs.existsSync(path), `${path} must exist`);
  return fs.readFileSync(path, 'utf8');
}

const forbiddenLegacy = /POLYGON_RPC_URL|polygon-rpc\.com|polygonscan\.com|0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e|ethers\.providers|ethers\.utils/i;
const activePaths = [
  'update-wallets.js',
  'backend/push-notify-wallets.js',
  'smart-contract/hardhat.config.js',
  'smart-contract/interact-mainnet.mjs',
  'smart-contract/fund-wallets.mjs',
  'smart-contract/utils/validateEnv.mjs',
  'smart-contract/scripts/deploy.mjs',
  'smart-contract/scripts/enable-trading.mjs',
  'smart-contract/scripts/verify-setup.mjs',
];

for (const path of activePaths) {
  assert.doesNotMatch(read(path), forbiddenLegacy, `${path} must not contain legacy Polygon or ethers-v5 operational code`);
}

const hardhatConfig = read('smart-contract/hardhat.config.js');
assert.doesNotMatch(hardhatConfig, /\bpolygon\s*:/i, 'primary Hardhat config must not expose Polygon production network');
assert.doesNotMatch(hardhatConfig, /\bmumbai\s*:/i, 'primary Hardhat config must not expose Mumbai production network');
assert.doesNotMatch(hardhatConfig, /\bamoy\s*:/i, 'primary Hardhat config must not expose Amoy production network');
assert.match(hardhatConfig, /\bbase\s*:/i, 'primary Hardhat config must expose Base Mainnet');
assert.match(hardhatConfig, /chainId:\s*8453/, 'primary Hardhat config must pin Base chain ID 8453');

const validateEnv = read('smart-contract/utils/validateEnv.mjs');
assert.match(validateEnv, /BASE_RPC_URL/, 'environment validator must use BASE_RPC_URL');
assert.match(validateEnv, /ethers\.formatEther/, 'environment validator must use ethers v6 formatting API');
assert.match(validateEnv, /ethers\.parseEther/, 'environment validator must use ethers v6 parsing API');

const updateWallets = read('update-wallets.js');
assert.match(updateWallets, /8453/, 'wallet updater must verify Base chain ID 8453');
assert.match(updateWallets, /getNetwork\(\)/, 'wallet updater must verify connected network before signing');
assert.match(updateWallets, /CONFIRM_WALLET_UPDATE/, 'wallet updater must require explicit write confirmation');

const fundWallets = read('smart-contract/fund-wallets.mjs');
assert.match(fundWallets, /8453/, 'wallet funding must verify Base chain ID 8453');
assert.match(fundWallets, /CONFIRM_WALLET_FUNDING/, 'wallet funding must require explicit write confirmation');

const interactMainnet = read('smart-contract/interact-mainnet.mjs');
assert.match(interactMainnet, /8453/, 'mainnet interaction script must verify Base chain ID 8453');
assert.match(interactMainnet, /CONFIRM_MAINNET_INTERACTION/, 'mainnet interaction must require explicit write confirmation');
assert.match(interactMainnet, /AETH_TOKEN_ADDRESS/, 'mainnet interaction must take the token address from canonical environment configuration');

const pushMonitor = read('backend/push-notify-wallets.js');
assert.match(pushMonitor, /BASE_RPC_URL/, 'wallet monitor must use Base RPC');
assert.match(pushMonitor, /prefetchedTransactions/, 'wallet monitor must use ethers v6 prefetched transactions');

const deployScript = read('smart-contract/scripts/deploy.mjs');
assert.match(deployScript, /CONFIRM_BASE_DEPLOYMENT/, 'Base deployment must require explicit confirmation');
assert.match(deployScript, /8453/, 'Base deployment script must verify chain ID 8453');

const enableTrading = read('smart-contract/scripts/enable-trading.mjs');
assert.match(enableTrading, /CONFIRM_ENABLE_TRADING/, 'enable-trading script must require explicit confirmation');
assert.match(enableTrading, /8453/, 'enable-trading script must verify Base chain ID 8453');
assert.match(enableTrading, /basescan\.org/i, 'enable-trading diagnostics must point to BaseScan');

const verifySetup = read('smart-contract/scripts/verify-setup.mjs');
assert.match(verifySetup, /Base Mainnet/, 'setup verifier must identify Base Mainnet');
assert.match(verifySetup, /8453/, 'setup verifier must require Base chain ID 8453');

const legacyLocalServer = read('backend/server.js');
assert.doesNotMatch(legacyLocalServer, /chainId:\s*137/, 'local backend must never fall back to Polygon chain ID 137');
assert.match(legacyLocalServer, /chainId:\s*8453/, 'local backend status/fallback must identify Base Mainnet');
assert.match(legacyLocalServer, /network:\s*['"]base['"]/, 'local backend API status must identify Base');
assert.match(
  legacyLocalServer,
  /app\.use\(['"]\/api\/nft['"],\s*router\)/,
  'local backend must mount NFT routes under /api/nft',
);

assert.equal(fs.existsSync('backend/scanner/launchpad-api.js'), false, 'obsolete CommonJS Polygon launchpad duplicate must be retired');
assert.equal(fs.existsSync('smart-contract/scripts/verify-setup.js'), false, 'obsolete duplicate setup verifier must be retired');
assert.equal(fs.existsSync('smart-contract/hardhat.config.minimal.js'), false, 'unused Polygon minimal Hardhat config must be retired');

const legacyDeployWorkflowPath = '.github/workflows/deploy-contracts.yml';
if (fs.existsSync(legacyDeployWorkflowPath)) {
  const legacyDeployWorkflow = read(legacyDeployWorkflowPath);
  assert.doesNotMatch(
    legacyDeployWorkflow,
    /\bpolygon\b|\bmumbai\b|verify:\$\{\{\s*matrix\.network\s*\}\}/i,
    'active contract deployment workflow must not target legacy networks or dynamic stale verify scripts',
  );
}

console.log('Active operational scripts and local backend are Base-only, ethers-v6 compatible, correctly routed, and write-gated.');
