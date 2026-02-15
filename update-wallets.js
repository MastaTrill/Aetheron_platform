#!/usr/bin/env node

// update-wallets.js - Update treasury wallet addresses in Aetheron contract
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.AETHERON_CONTRACT_ADDRESS; // Set your contract address in .env as AETHERON_CONTRACT_ADDRESS
const ABI = [
  'function updateWallets(address newTeamWallet, address newMarketingWallet, address newStakingPool)',
];

if (!process.env.POLYGON_RPC_URL || !process.env.PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error('Missing POLYGON_RPC_URL, PRIVATE_KEY, or AETHERON_CONTRACT_ADDRESS in .env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

async function main() {
  const teamWallet = process.env.TEAM_WALLET;
  const marketingWallet = process.env.MARKETING_WALLET;
  const stakingPool = process.env.STAKING_POOL;

  if (!teamWallet || !marketingWallet || !stakingPool) {
    console.error('Missing wallet address in .env');
    process.exit(1);
  }

  if (
    teamWallet === '0x0000000000000000000000000000000000000000' ||
    marketingWallet === '0x0000000000000000000000000000000000000000' ||
    stakingPool === '0x0000000000000000000000000000000000000000'
  ) {
    console.error('Wallet address cannot be zero address');
    process.exit(1);
  }

  console.log('Updating wallets...');
  console.log('Team:', teamWallet);
  console.log('Marketing:', marketingWallet);
  console.log('Staking Pool:', stakingPool);

  const tx = await contract.updateWallets(
    teamWallet,
    marketingWallet,
    stakingPool,
  );
  console.log('Transaction hash:', tx.hash);
  await tx.wait();
  console.log('Wallets updated successfully!');
}

main();
