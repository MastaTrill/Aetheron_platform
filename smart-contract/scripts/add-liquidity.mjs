#!/usr/bin/env node

/**
 * Aetheron Liquidity Addition Script
 * Adds AETH/USDC liquidity to QuickSwap V2 on Polygon
 *
 * Usage:
 *   PRIVATE_KEY=... POLYGON_RPC_URL=... node add-liquidity.mjs [options]
 *
 * Options:
 *   --aeth <amount>     AETH amount (default: 10000000)
 *   --usdc <amount>     USDC amount (default: match AETH price)
 *   --dry-run           Simulate without sending transactions
 *   --slippage <pct>    Slippage tolerance (default: 5)
 */

import dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';
import fs from 'fs';

// --- CLI args ---
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const isDryRun = args.includes('--dry-run');
const aethAmountStr = get('--aeth') || '10000000';
const usdcAmountStr = get('--usdc') || null;
const slippagePct = parseInt(get('--slippage') || '5', 10);

// --- Config ---
const AETH_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const USDC_TOKEN = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const QUICKSWAP_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

const ERC20_MINIMAL = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)',
  'function factory() view returns (address)',
];

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('💧 AETHERON - ADD LIQUIDITY TO QUICKSWAP');
  console.log('='.repeat(60) + '\n');

  // --- Setup ---
  const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not set in .env or environment');
    console.error('   Create a .env file with: PRIVATE_KEY=0x...');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📍 Wallet:', wallet.address);

  const [balance, network] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.getNetwork(),
  ]);

  console.log('🌐 Chain ID:', network.chainId.toString());
  console.log('💰 MATIC Balance:', ethers.formatEther(balance), 'MATIC\n');

  if (network.chainId !== 137n) {
    console.error('❌ Wrong network! Expected Polygon (137), got', network.chainId.toString());
    process.exit(1);
  }

  // --- Contracts ---
  const aeth = new ethers.Contract(AETH_TOKEN, ERC20_MINIMAL, wallet);
  const usdc = new ethers.Contract(USDC_TOKEN, ERC20_MINIMAL, wallet);
  const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, wallet);

  // --- Balances ---
  const [aethBal, usdcBal, aethSym, usdcSym] = await Promise.all([
    aeth.balanceOf(wallet.address),
    usdc.balanceOf(wallet.address),
    aeth.symbol().catch(() => 'AETH'),
    usdc.symbol().catch(() => 'USDC'),
  ]);

  console.log(`🪙 ${aethSym} Balance:`, ethers.formatEther(aethBal));
  console.log(`💵 ${usdcSym} Balance:`, ethers.formatUnits(usdcBal, 6), '\n');

  // --- Amounts ---
  const aethAmount = ethers.parseEther(aethAmountStr);
  let usdcAmount;

  if (usdcAmountStr) {
    usdcAmount = ethers.parseUnits(usdcAmountStr, 6);
  } else {
    // Default: 1:1 USD ratio (1 AETH = $1 worth of USDC)
    usdcAmount = ethers.parseUnits(aethAmountStr, 6);
  }

  const pricePerAETH = Number(ethers.formatUnits(usdcAmount, 6)) / Number(ethers.formatEther(aethAmount));
  const estMarketCap = pricePerAETH * 1_000_000_000;

  console.log('📋 Liquidity Configuration:');
  console.log('  AETH:', ethers.formatEther(aethAmount));
  console.log('  USDC:', ethers.formatUnits(usdcAmount, 6));
  console.log('  Price:', pricePerAETH.toFixed(6), 'USDC per AETH');
  console.log('  Est. Market Cap: $' + estMarketCap.toLocaleString());
  console.log('  Slippage:', slippagePct + '%');
  console.log('  Mode:', isDryRun ? 'DRY RUN (simulation only)' : 'LIVE', '\n');

  // --- Validation ---
  if (aethBal < aethAmount) {
    console.error(`❌ Insufficient AETH! Have ${ethers.formatEther(aethBal)}, need ${aethAmountStr}`);
    process.exit(1);
  }
  if (usdcBal < usdcAmount) {
    console.error(`❌ Insufficient USDC! Have ${ethers.formatUnits(usdcBal, 6)}, need ${usdcAmountStr}`);
    process.exit(1);
  }
  const estimatedGas = ethers.parseEther('0.05');
  if (balance < estimatedGas) {
    console.error('❌ Insufficient MATIC for gas! Need at least 0.05 MATIC');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('✅ DRY RUN: All validations passed. Ready to add liquidity.');
    console.log('   Run without --dry-runt to execute.');
    process.exit(0);
  }

  // --- Step 1: Approve AETH ---
  console.log('━'.repeat(60));
  console.log('STEP 1: Approve Router to spend AETH');
  console.log('━'.repeat(60));

  const aethAllowance = await aeth.allowance(wallet.address, QUICKSWAP_ROUTER);
  if (aethAllowance < aethAmount) {
    const tx = await aeth.approve(QUICKSWAP_ROUTER, ethers.MaxUint256);
    console.log('📤 Approval tx:', tx.hash);
    await tx.wait();
    console.log('✅ AETH approved\n');
  } else {
    console.log('✅ AETH already approved\n');
  }

  // --- Step 2: Approve USDC ---
  console.log('━'.repeat(60));
  console.log('STEP 2: Approve Router to spend USDC');
  console.log('━'.repeat(60));

  const usdcAllowance = await usdc.allowance(wallet.address, QUICKSWAP_ROUTER);
  if (usdcAllowance < usdcAmount) {
    const tx = await usdc.approve(QUICKSWAP_ROUTER, ethers.MaxUint256);
    console.log('📤 Approval tx:', tx.hash);
    await tx.wait();
    console.log('✅ USDC approved\n');
  } else {
    console.log('✅ USDC already approved\n');
  }

  // --- Step 3: Add Liquidity ---
  console.log('━'.repeat(60));
  console.log('STEP 3: Add Liquidity to QuickSwap');
  console.log('━'.repeat(60));

  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 min
  const minAeth = aethAmount * BigInt(100 - slippagePct) / 100n;
  const minUsdc = usdcAmount * BigInt(100 - slippagePct) / 100n;

  console.log('📤 Sending addLiquidity transaction...');
  console.log('   Min AETH:', ethers.formatEther(minAeth));
  console.log('   Min USDC:', ethers.formatUnits(minUsdc, 6));

  const tx = await router.addLiquidity(
    AETH_TOKEN, USDC_TOKEN,
    aethAmount, usdcAmount,
    minAeth, minUsdc,
    wallet.address, deadline
  );

  console.log('   Tx hash:', tx.hash);
  console.log('⏳ Waiting for confirmation...');

  const receipt = await tx.wait();
  console.log('✅ Liquidity added! Block:', receipt.blockNumber, '\n');

  // --- Summary ---
  console.log('='.repeat(60));
  console.log('🎉 LIQUIDITY POOL CREATED');
  console.log('='.repeat(60));
  console.log('  Pair:   AETH/USDC');
  console.log('  DEX:    QuickSwap V2 (Polygon)');
  console.log('  Tx:     https://polygonscan.com/tx/' + receipt.transactionHash);
  console.log('  Pool:   https://quickswap.exchange/#/pool');
  console.log('  Trade:  https://quickswap.exchange/#/swap?outputCurrency=' + AETH_TOKEN);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ ERROR:', err.reason || err.message || err);
    process.exit(1);
  });
