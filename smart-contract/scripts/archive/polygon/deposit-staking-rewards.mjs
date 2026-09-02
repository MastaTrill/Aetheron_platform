#!/usr/bin/env node

/**
 * Deposit Staking Rewards into AetheronStaking contract on Polygon Mainnet
 *
 * Usage:
 *   node scripts/deposit-staking-rewards.mjs --dry-run --amount 1000000
 *   node scripts/deposit-staking-rewards.mjs --verify-only
 *   PRIVATE_KEY=0x... node scripts/deposit-staking-rewards.mjs --amount 1000000 --confirm
 *
 * Options:
 *   --amount <aeth>     Amount of AETH tokens to deposit as rewards (default: 100000)
 *   --staking <addr>    Override Staking contract address (default: 0x896D9d37A67B0bBf81dde0005975DA7850FFa638)
 *   --token <addr>      Override AETH token address (default: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e)
 *   --dry-run           Simulate without broadcasting transactions
 *   --verify-only       Inspect pool reward balances and exit
 *   --confirm           Authorize live on-chain broadcast
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const scriptDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
dotenv.config({ path: path.resolve(scriptDir, '../.env'), override: true });
dotenv.config();


const POLYGON_RPCS = [
  process.env.POLYGON_RPC_URL,
  process.env.RPC_URL,
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon.llamarpc.com',
  'https://1rpc.io/matic',
  'https://polygon.drpc.org',
].filter(Boolean);

const DEFAULTS = {
  chainId: 137,
  token: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
  staking: '0x896D9d37A67B0bBf81dde0005975DA7850FFa638',
  defaultAmount: '100000',
};

const STAKING_ABI = [
  'function owner() view returns (address)',
  'function aetheronToken() view returns (address)',
  'function poolCount() view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'function rewardBalance() view returns (uint256)',
  'function depositRewards(uint256 amount) external',
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      if (v !== undefined) args[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) args[k] = argv[++i];
      else args[k] = true;
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

  const amountStr = args.amount || process.env.STAKING_DEPOSIT_AMOUNT || DEFAULTS.defaultAmount;
  const tokenAddress = args.token || process.env.AETH_TOKEN_ADDRESS || DEFAULTS.token;
  const stakingAddress = args.staking || process.env.STAKING_CONTRACT_ADDRESS || DEFAULTS.staking;

  hr('💰 AETHERON STAKING REWARD DEPOSIT');

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
      // Try next
    }
  }

  if (!provider) {
    console.error('❌ Could not connect to any Polygon RPC endpoints.');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log('  Staking Contract:    ', stakingAddress);
  console.log('  AETH Token Address:  ', tokenAddress);
  console.log('  Active RPC Endpoint: ', activeRpc);
  console.log('  Deposit Amount:      ', amountStr, 'AETH');
  console.log('  Mode:                ', isVerifyOnly ? 'VERIFY ONLY' : isDryRun ? 'DRY RUN (Simulation)' : 'LIVE BROADCAST');

  const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, provider);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  // Inspect on-chain state
  console.log('\n📊 Fetching on-chain staking status...');
  const [owner, poolCount, totalStaked, rewardBal, tokenSymbol] = await Promise.all([
    stakingContract.owner().catch(() => 'UNKNOWN'),
    stakingContract.poolCount().catch(() => 0n),
    stakingContract.totalStaked().catch(() => 0n),
    stakingContract.rewardBalance().catch(() => 0n),
    tokenContract.symbol().catch(() => 'AETH'),
  ]);

  console.log('\n' + '─'.repeat(64));
  console.log('STAKING STATUS REPORT:');
  console.log('─'.repeat(64));
  console.log(`  Contract Owner:       ${owner}`);
  console.log(`  Active Pools:         ${poolCount.toString()}`);
  console.log(`  Total Staked:         ${ethers.formatEther(totalStaked)} ${tokenSymbol}`);
  console.log(`  Current Reward Bal:   ${ethers.formatEther(rewardBal)} ${tokenSymbol}`);
  console.log('─'.repeat(64));

  if (isVerifyOnly) {
    console.log('\nℹ️ --verify-only specified. Exiting without execution.');
    return;
  }

  const depositWei = ethers.parseEther(amountStr);

  if (isDryRun) {
    console.log('\n✅ [DRY-RUN SIMULATION]');
    console.log(`  Validated deposit of ${amountStr} ${tokenSymbol} (${depositWei.toString()} wei)`);
    console.log('  Steps to be performed on live execution:');
    console.log('    1. approve(stakingContract, depositAmount) if allowance is insufficient');
    console.log('    2. depositRewards(depositAmount) to credit reward pool');
    console.log('  Run with PRIVATE_KEY and --confirm to execute on-chain.');
    return;
  }

  const privateKey = process.env.POLYGON_OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY;
  if (!privateKey) {
    console.error('\n❌ ERROR: Missing PRIVATE_KEY for live execution.');
    process.exit(1);
  }

  if (!isConfirmed) {
    console.error('\n❌ ERROR: Live execution requires --confirm flag.');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const signerBal = await tokenContract.balanceOf(wallet.address);
  const polBal = await provider.getBalance(wallet.address);

  console.log('  Caller Address:      ', wallet.address);
  console.log('  Caller AETH Balance: ', ethers.formatEther(signerBal), tokenSymbol);
  console.log('  Caller POL Balance:  ', ethers.formatEther(polBal), 'POL');

  if (signerBal < depositWei) {
    console.error(`\n❌ ERROR: Insufficient AETH balance. Caller has ${ethers.formatEther(signerBal)}, needs ${amountStr}`);
    process.exit(1);
  }

  if (polBal < ethers.parseEther('0.05')) {
    console.error('\n❌ ERROR: Insufficient POL for gas fees.');
    process.exit(1);
  }

  const tokenWithSigner = tokenContract.connect(wallet);
  const stakingWithSigner = stakingContract.connect(wallet);

  // Check allowance
  const currentAllowance = await tokenContract.allowance(wallet.address, stakingAddress);
  if (currentAllowance < depositWei) {
    console.log('\n⏳ Approving Staking Contract to spend AETH...');
    const approveTx = await tokenWithSigner.approve(stakingAddress, ethers.MaxUint256);
    console.log('  📤 Approval Tx:', approveTx.hash);
    await approveTx.wait(2);
    console.log('  ✅ Approval confirmed!');
  } else {
    console.log('\n✅ Staking contract already approved.');
  }

  console.log('\n⏳ Depositing rewards...');
  const depositTx = await stakingWithSigner.depositRewards(depositWei);
  console.log('  📤 Deposit Tx:', depositTx.hash);
  const receipt = await depositTx.wait(2);
  console.log(`  ✅ Deposit confirmed in block ${receipt.blockNumber}!`);

  const updatedRewardBal = await stakingContract.rewardBalance();
  console.log(`\n🎉 New Staking Reward Balance: ${ethers.formatEther(updatedRewardBal)} ${tokenSymbol}`);

  // Save record
  const record = {
    network: 'polygon',
    chainId: 137,
    staking: stakingAddress,
    token: tokenAddress,
    depositAmount: amountStr,
    depositWei: depositWei.toString(),
    txHash: depositTx.hash,
    blockNumber: receipt.blockNumber,
    timestamp: new Date().toISOString(),
  };

  const receiptPath = path.resolve('deployments/staking-reward-deposit.json');
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify(record, null, 2));
  console.log('📄 Receipt saved to: deployments/staking-reward-deposit.json');

  hr('🎉 REWARDS DEPOSITED SUCCESSFULLY');
}

main().catch((err) => {
  console.error('\n❌ Execution failed:', err?.reason || err?.message || err);
  process.exit(1);
});
