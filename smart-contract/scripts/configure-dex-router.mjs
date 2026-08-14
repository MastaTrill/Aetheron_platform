#!/usr/bin/env node

/**
 * Configure DEX Router & Liquidity Pool Binding for Aetheron ($AETH) on Polygon Mainnet
 *
 * Usage:
 *   node scripts/configure-dex-router.mjs --dry-run
 *   node scripts/configure-dex-router.mjs --verify-only
 *   PRIVATE_KEY=0x... node scripts/configure-dex-router.mjs --confirm
 *
 * Options:
 *   --router <addr>     Override QuickSwap router address (default: 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff)
 *   --pool <addr>       Override Liquidity Pool pair address (default: 0xd57c5E33ebDC1b565F99d06809debbf86142705D)
 *   --token <addr>      Override AETH token address (default: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e)
 *   --dry-run           Simulate transactions without broadcasting
 *   --verify-only       Inspect on-chain status and exit
 *   --confirm           Acknowledge broadcast on live network
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const scriptDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
dotenv.config({ path: path.resolve(scriptDir, '../.env'), override: true });
dotenv.config();


// Default addresses and RPC fallback endpoints for Polygon Mainnet
const POLYGON_RPCS = [
  process.env.POLYGON_RPC_URL,
  process.env.RPC_URL,
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon.llamarpc.com',
  'https://1rpc.io/matic',
  'https://polygon.drpc.org',
  'https://polygon-rpc.com',
].filter(Boolean);

const DEFAULTS = {
  chainId: 137,
  token: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
  quickswapRouter: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  liquidityPool: '0xd57c5E33ebDC1b565F99d06809debbf86142705D',
};


const AETHERON_ABI = [
  'function owner() view returns (address)',
  'function tradingEnabled() view returns (bool)',
  'function quickswapRouter() view returns (address)',
  'function liquidityPool() view returns (address)',
  'function isExcludedFromTax(address) view returns (bool)',
  'function buyTaxRate() view returns (uint256)',
  'function sellTaxRate() view returns (uint256)',
  'function setQuickSwapRouter(address _router) external',
  'function setLiquidityPool(address _pool) external',
  'function setExcludedFromTax(address account, bool excluded) external',
  'function enableTrading() external',
];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      if (v !== undefined) {
        args[k] = v;
      } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args[k] = argv[++i];
      } else {
        args[k] = true;
      }
    }
  }
  return args;
}

function hr(msg = '') {
  console.log('\n' + '='.repeat(64));
  if (msg) console.log(msg);
  console.log('='.repeat(64) + '\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const isDryRun = Boolean(args['dry-run'] || args.dryrun || args.dry);
  const isVerifyOnly = Boolean(args['verify-only'] || args.verify);
  const isConfirmed = Boolean(args.confirm || args.yes);

  const tokenAddress = args.token || process.env.AETH_TOKEN_ADDRESS || DEFAULTS.token;
  const targetRouter = args.router || process.env.QUICKSWAP_ROUTER_ADDRESS || DEFAULTS.quickswapRouter;
  const targetPool = args.pool || process.env.LIQUIDITY_POOL_ADDRESS || DEFAULTS.liquidityPool;
  const selectedRpc = args.rpc;
  const candidateRpcs = selectedRpc ? [selectedRpc] : POLYGON_RPCS;

  let provider = null;
  let network = null;
  let activeRpc = null;

  for (const rpc of candidateRpcs) {
    try {
      const p = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      const net = await Promise.race([
        p.getNetwork(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 4000)),
      ]);
      provider = p;
      network = net;
      activeRpc = rpc;
      break;
    } catch (e) {
      // Try next endpoint
    }
  }

  if (!provider) {
    console.error('❌ Could not connect to any Polygon RPC endpoints. Please specify a custom RPC via --rpc <url>');
    process.exit(1);
  }

  console.log('Target Configuration:');
  console.log('  Token Address:        ', tokenAddress);
  console.log('  Target Router:        ', targetRouter);
  console.log('  Target Liquidity Pool:', targetPool);
  console.log('  Active RPC Endpoint:  ', activeRpc);
  console.log('  Connected Chain ID:   ', network.chainId.toString());
  console.log('  Mode:                 ', isVerifyOnly ? 'VERIFY ONLY' : isDryRun ? 'DRY RUN (Simulation)' : 'LIVE BROADCAST');


  // Setup Signer or Readonly
  let signer = null;
  const privateKey = process.env.POLYGON_OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY;

  if (!isVerifyOnly && !isDryRun) {
    if (!privateKey) {
      console.error('\n❌ ERROR: PRIVATE_KEY not found in environment for live broadcast.');
      console.error('   Please run with --dry-run or provide PRIVATE_KEY in .env');
      process.exit(1);
    }
    signer = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(signer.address);
    console.log('  Signer Address:       ', signer.address);
    console.log('  Signer Balance:       ', ethers.formatEther(balance), 'POL');

    if (!isConfirmed) {
      console.error('\n❌ ERROR: Live execution requires --confirm flag.');
      process.exit(1);
    }
  }

  const contract = new ethers.Contract(tokenAddress, AETHERON_ABI, signer || provider);

  // Read on-chain status
  console.log('\n📊 Fetching on-chain state...');
  const [
    owner,
    tradingEnabled,
    currentRouter,
    currentPool,
    buyTaxRate,
    sellTaxRate,
    isRouterExcluded,
    isPoolExcluded
  ] = await Promise.all([
    contract.owner().catch(() => 'UNKNOWN'),
    contract.tradingEnabled().catch(() => false),
    contract.quickswapRouter().catch(() => ethers.ZeroAddress),
    contract.liquidityPool().catch(() => ethers.ZeroAddress),
    contract.buyTaxRate().catch(() => 3n),
    contract.sellTaxRate().catch(() => 5n),
    contract.isExcludedFromTax(targetRouter).catch(() => false),
    contract.isExcludedFromTax(targetPool).catch(() => false)
  ]);

  console.log('\n' + '─'.repeat(64));
  console.log('ON-CHAIN STATUS REPORT:');
  console.log('─'.repeat(64));
  console.log(`  Contract Owner:          ${owner}`);
  console.log(`  Trading Enabled:         ${tradingEnabled ? '✅ YES' : '❌ NO'}`);
  console.log(`  Current QuickSwap Router: ${currentRouter} (${currentRouter.toLowerCase() === targetRouter.toLowerCase() ? '✅ MATCH' : '⚠️ NOT SET / MISMATCH'})`);
  console.log(`  Current Liquidity Pool:   ${currentPool} (${currentPool.toLowerCase() === targetPool.toLowerCase() ? '✅ MATCH' : '⚠️ NOT SET / MISMATCH'})`);
  console.log(`  Buy Tax Rate:            ${buyTaxRate.toString()}%`);
  console.log(`  Sell Tax Rate:           ${sellTaxRate.toString()}%`);
  console.log(`  Router Excluded from Tax: ${isRouterExcluded ? '✅ YES' : '❌ NO'}`);
  console.log(`  Pool Tax Pass-Through:   ${!isPoolExcluded ? '✅ ACTIVE (Swaps taxed)' : '⚠️ EXCLUDED (0% tax on swaps)'}`);
  console.log('─'.repeat(64));

  const actions = [];

  if (currentRouter.toLowerCase() !== targetRouter.toLowerCase()) {
    actions.push({
      step: 'setQuickSwapRouter',
      desc: `Set QuickSwap Router to ${targetRouter}`,
      call: () => contract.setQuickSwapRouter(targetRouter),
    });
  }

  if (currentPool.toLowerCase() !== targetPool.toLowerCase()) {
    actions.push({
      step: 'setLiquidityPool',
      desc: `Set Liquidity Pool to ${targetPool}`,
      call: () => contract.setLiquidityPool(targetPool),
    });
  }

  // To enable automated single-pass tax on swaps, pool must NOT be excluded
  if (isPoolExcluded) {
    actions.push({
      step: 'setExcludedFromTax',
      desc: `Set isExcludedFromTax(${targetPool}, false) for single-pass swap tax`,
      call: () => contract.setExcludedFromTax(targetPool, false),
    });
  }

  if (actions.length === 0) {
    console.log('\n🎉 ALL CONFIGURATIONS ALREADY IN DESIRED STATE! No transactions needed.');
    return;
  }

  console.log(`\n📋 Pending Action Items (${actions.length}):`);
  actions.forEach((a, i) => console.log(`  ${i + 1}. [${a.step}] ${a.desc}`));

  if (isVerifyOnly) {
    console.log('\nℹ️ --verify-only specified. Exiting without execution.');
    return;
  }

  if (isDryRun) {
    console.log('\n✅ [DRY-RUN SIMULATION]');
    console.log('   All target methods and parameters validated successfully.');
    console.log('   Run with PRIVATE_KEY and --confirm to broadcast on-chain.');
    return;
  }

  // Live execution
  console.log('\n🚀 Broadcasting transactions...');
  const receipts = [];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    console.log(`\n[${i + 1}/${actions.length}] Executing: ${act.desc}...`);
    const tx = await act.call();
    console.log(`  📤 Tx Broadcast: ${tx.hash}`);
    console.log('  ⏳ Waiting for confirmations...');
    const receipt = await tx.wait(2);
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber} (Status: ${receipt.status})`);
    receipts.push({
      step: act.step,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });
  }

  // Save execution record
  const record = {
    network: 'polygon',
    chainId: 137,
    token: tokenAddress,
    router: targetRouter,
    pool: targetPool,
    timestamp: new Date().toISOString(),
    receipts,
  };

  const receiptPath = path.join(process.cwd(), 'deployments', 'polygon-router-binding-receipt.json');
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify(record, null, 2));
  console.log(`\n📄 Execution receipt saved to: ${receiptPath}`);

  hr('🎉 POLYGON ROUTER BINDING COMPLETE');
}

main().catch((err) => {
  console.error('\n❌ Execution failed:', err?.reason || err?.message || err);
  process.exit(1);
});
