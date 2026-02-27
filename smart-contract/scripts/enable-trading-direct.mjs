import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';

// Load env early
dotenv.config();

// ---------- Helpers ----------
const MIN_NODE = [18, 18, 0];
function assertNodeVersion() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const ok = major > MIN_NODE[0] || (major === MIN_NODE[0] && (minor > MIN_NODE[1] || (minor === MIN_NODE[1] && patch >= MIN_NODE[2])));
  if (!ok) {
    console.error(`Node ${process.versions.node} is too old. Require >= ${MIN_NODE.join('.')}.`);
    process.exit(2);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const [k, v] = a.startsWith('--') ? a.replace(/^--/, '').split('=') : [null, null];
    if (k) {
      if (v !== undefined) args[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) { args[k] = argv[++i]; }
      else args[k] = true;
    }
  }
  return args;
}

function hr(msg = '') {
  console.log('\n' + '='.repeat(60));
  if (msg) console.log(msg);
  console.log('='.repeat(60) + '\n');
}

function getNetworkFromArgsOrEnv(args) {
  // Prefer CLI, then ENV, fallback polygon
  return args.network || process.env.NETWORK || 'polygon';
}

function getRpcUrl(network) {
  const fromEnv = process.env.RPC_URL || process.env[`${network.toUpperCase()}_RPC`] || process.env.POLYGON_RPC;
  if (fromEnv) return fromEnv;
  // public defaults (best effort)
  const map = {
    polygon: 'https://polygon-rpc.com',
    sepolia: 'https://rpc.sepolia.org',
    mainnet: 'https://eth.llamarpc.com',
  };
  return map[network] || map.polygon;
}

function mustGetPrivateKey() {
  const pk = process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY;
  if (!pk) {
    console.error('Missing PRIVATE_KEY in environment. Aborting.');
    process.exit(3);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    console.error('PRIVATE_KEY format invalid. Expect 0x-prefixed 64-hex.');
    process.exit(4);
  }
  return pk;
}

async function waitConfirmations(tx, confirmations = 2) {
  console.log(`⏳ Waiting for ${confirmations} confirmation(s)...`);
  const receipt = await tx.wait(confirmations);
  return receipt;
}

async function withRetry(fn, { retries = 3, delayMs = 1500 } = {}) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      console.warn(`Attempt ${i + 1} failed: ${e?.message || e}. Retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function isLive(network) {
  return ['mainnet', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'].includes(network);
}

function getTokenAddress(args) {
  // CLI flag overrides env, otherwise hardcoded fallback
  return (
    args.token ||
    process.env.AETH_TOKEN_ADDRESS ||
    '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e'
  );
}

function summary(ctx) {
  const { network, rpcUrl, wallet, token } = ctx;
  console.log('Context:');
  console.log(`  Network: ${network}`);
  console.log(`  RPC URL: ${rpcUrl}`);
  console.log(`  Account: ${wallet.address}`);
  console.log(`  Token:   ${token}`);
}

// ---------- Main ----------
async function main() {
  assertNodeVersion();

  const args = parseArgs(process.argv);
  const dryRun = Boolean(args['dry-run'] || args.dryrun || args.dry);
  const confirmations = Number(args['tx-wait'] || args.wait || 2);
  const requireConfirm = Boolean(args.confirm || args.yes);

  hr('🚀 Enabling Trading for Aetheron Token');

  // Provider and wallet
  const network = getNetworkFromArgsOrEnv(args);
  const rpcUrl = getRpcUrl(network);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(mustGetPrivateKey(), provider);

  const token = getTokenAddress(args);

  summary({ network, rpcUrl, wallet, token });

  if (isLive(network) && !requireConfirm) {
    console.error('Refusing to run on a live network without --confirm');
    process.exit(5);
  }

  // Load artifact with guard
  let AetheronArtifact;
  try {
    const raw = fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8');
    AetheronArtifact = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read Aetheron artifact. Ensure it is compiled at artifacts/contracts/Aetheron.sol/Aetheron.json');
    console.error(e.message || e);
    process.exit(6);
  }

  const aetheron = new ethers.Contract(token, AetheronArtifact.abi, wallet);

  // Check current status with retry for robustness
  const tradingEnabled = await withRetry(() => aetheron.tradingEnabled());
  console.log('Current trading status:', tradingEnabled ? 'ENABLED ✅' : 'DISABLED ❌');

  if (tradingEnabled) {
    console.log('✅ Trading is already enabled. Nothing to do.');
    return;
  }

  if (dryRun) {
    console.log('[DRY-RUN] Would call enableTrading()');
    return;
  }

  console.log('⏳ Sending transaction: enableTrading() ...');
  const tx = await aetheron.enableTrading();
  console.log('Transaction hash:', tx.hash);

  const receipt = await waitConfirmations(tx, confirmations);
  console.log(`✅ Mined in block ${receipt.blockNumber} with status ${receipt.status}`);

  // Verify new status
  const newStatus = await withRetry(() => aetheron.tradingEnabled());

  hr();
  if (newStatus) {
    console.log('🎉 SUCCESS! Trading is now ENABLED!');
    console.log('\nUsers can now:');
    console.log('  ✅ Buy and sell AETH tokens');
    console.log('  ✅ Transfer tokens to other wallets');
    console.log('  ✅ Add liquidity to DEX pools');
  } else {
    console.error('❌ ERROR: Trading status unchanged!');
    process.exit(7);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Unhandled ERROR:', error?.stack || error?.message || String(error));
    process.exit(1);
  });
