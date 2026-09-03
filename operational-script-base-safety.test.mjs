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
  'smart-contract/interact-mainnet.mjs',
  'smart-contract/fund-wallets.mjs',
  'smart-contract/utils/validateEnv.mjs',
  'smart-contract/scripts/verify-setup.mjs',
];

for (const path of activePaths) {
  assert.doesNotMatch(read(path), forbiddenLegacy, `${path} must not contain legacy Polygon or ethers-v5 operational code`);
}

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

const verifySetup = read('smart-contract/scripts/verify-setup.mjs');
assert.match(verifySetup, /Base Mainnet/, 'setup verifier must identify Base Mainnet');
assert.match(verifySetup, /8453/, 'setup verifier must require Base chain ID 8453');

assert.equal(fs.existsSync('backend/scanner/launchpad-api.js'), false, 'obsolete CommonJS Polygon launchpad duplicate must be retired');
assert.equal(fs.existsSync('smart-contract/scripts/verify-setup.js'), false, 'obsolete duplicate setup verifier must be retired');
assert.equal(fs.existsSync('smart-contract/hardhat.config.minimal.js'), false, 'unused Polygon minimal Hardhat config must be retired');

console.log('Active operational scripts are Base-only, ethers-v6 compatible, and write-gated.');
