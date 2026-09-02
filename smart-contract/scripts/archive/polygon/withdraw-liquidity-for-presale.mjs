#!/usr/bin/env node

/**
 * Withdraw AETH/MATIC liquidity from QuickSwap and send AETH to presale
 *
 * Usage:
 *   PRIVATE_KEY=... POLYGON_RPC_URL=... node withdraw-liquidity-for-presale.mjs [options]
 *
 * Options:
 *   --percent <pct>     Percentage of LP to withdraw (default: 100)
 *   --presale <addr>    Presale contract address to receive AETH
 *   --dry-run           Simulate without sending transactions
 */

import { ethers } from 'ethers';

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const isDryRun = args.includes('--dry-run');
const percentStr = get('--percent') || '100';
const presaleAddr = get('--presale') || null;

const AETH_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const WMATIC_TOKEN = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
const QUICKSWAP_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';
const LP_TOKEN = '0xd57c5E33ebDC1b565F99d06809debbf86142705D';

const ERC20_MINIMAL = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const ROUTER_ABI = [
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)',
  'function getReserves(address factory, address tokenA, address tokenB) view returns (uint112 reserveA, uint112 reserveB)',
];

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 WITHDRAW LIQUIDITY → FUND PRESALE');
  console.log('='.repeat(60) + '\n');

  const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not set');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📍 Wallet:', wallet.address);

  const network = await provider.getNetwork();
  if (network.chainId !== 137n) {
    console.error('❌ Wrong network! Expected Polygon (137)');
    process.exit(1);
  }

  const lp = new ethers.Contract(LP_TOKEN, ERC20_MINIMAL, wallet);
  const aeth = new ethers.Contract(AETH_TOKEN, ERC20_MINIMAL, wallet);
  const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, wallet);

  const lpBalance = await lp.balanceOf(wallet.address);
  if (lpBalance === 0n) {
    console.error('❌ No LP tokens in wallet. Cannot withdraw.');
    process.exit(1);
  }

  const withdrawPct = BigInt(percentStr);
  const liquidityToRemove = lpBalance * withdrawPct / 100n;

  console.log('💧 LP Balance:', ethers.formatEther(lpBalance));
  console.log('📊 Withdrawing:', percentStr + '% =', ethers.formatEther(liquidityToRemove), 'LP tokens');

  if (isDryRun) {
    console.log('\n✅ DRY RUN: Ready to withdraw liquidity.');
    process.exit(0);
  }

  // Step 1: Approve router to spend LP tokens
  console.log('\n━'.repeat(60));
  console.log('STEP 1: Approve Router to spend LP tokens');
  console.log('━'.repeat(60));

  const lpAllowance = await lp.allowance(wallet.address, QUICKSWAP_ROUTER);
  if (lpAllowance < liquidityToRemove) {
    const tx = await lp.approve(QUICKSWAP_ROUTER, ethers.MaxUint256);
    console.log('📤 Approval tx:', tx.hash);
    await tx.wait();
    console.log('✅ LP tokens approved\n');
  } else {
    console.log('✅ LP tokens already approved\n');
  }

  // Step 2: Remove liquidity
  console.log('━'.repeat(60));
  console.log('STEP 2: Remove Liquidity from QuickSwap');
  console.log('━'.repeat(60));

  const deadline = Math.floor(Date.now() / 1000) + 1200;
  const minAeth = 0n;
  const minMatic = 0n;

  console.log('📤 Sending removeLiquidity transaction...');
  const tx = await router.removeLiquidity(
    AETH_TOKEN, WMATIC_TOKEN,
    liquidityToRemove, minAeth, minMatic,
    wallet.address, deadline
  );

  console.log('   Tx hash:', tx.hash);
  console.log('⏳ Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log('✅ Liquidity removed! Block:', receipt.blockNumber);

  // Step 3: Check AETH balance and send to presale
  const aethBalance = await aeth.balanceOf(wallet.address);
  console.log('\n💰 AETH Balance after withdraw:', ethers.formatEther(aethBalance));

  if (presaleAddr && aethBalance > 0n) {
    console.log('\n━'.repeat(60));
    console.log('STEP 3: Send AETH to Presale Contract');
    console.log('━'.repeat(60));

    const sendTx = await aeth.transfer(presaleAddr, aethBalance);
    console.log('📤 Transfer tx:', sendTx.hash);
    await sendTx.wait();
    console.log('✅ Sent', ethers.formatEther(aethBalance), 'AETH to presale at', presaleAddr);
  } else if (!presaleAddr) {
    console.log('\n⚠️  No --presale address provided. AETH stays in wallet.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DONE');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ ERROR:', err.reason || err.message || err);
    process.exit(1);
  });
