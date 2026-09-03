#!/usr/bin/env node

import { ethers } from 'ethers';

const BASE_CHAIN_ID = 8453;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const CONTRACT_ADDRESS = process.env.AETH_TOKEN_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ABI = [
  'function updateWallets(address newTeamWallet, address newMarketingWallet, address newStakingPool)',
];

function requireAddress(value, name) {
  if (!value || !ethers.isAddress(value) || value.toLowerCase() === ethers.ZeroAddress.toLowerCase()) {
    throw new Error(`${name} must be a valid non-zero EVM address`);
  }
  return value;
}

async function main() {
  if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
    throw new Error('PRIVATE_KEY must be a valid 0x-prefixed 32-byte key');
  }
  requireAddress(CONTRACT_ADDRESS, 'AETH_TOKEN_ADDRESS');

  if (process.env.CONFIRM_WALLET_UPDATE !== 'CONFIRM_WALLET_UPDATE') {
    throw new Error('Refusing wallet update. Set CONFIRM_WALLET_UPDATE=CONFIRM_WALLET_UPDATE for an intentional Base write.');
  }

  const teamWallet = requireAddress(process.env.TEAM_WALLET, 'TEAM_WALLET');
  const marketingWallet = requireAddress(process.env.MARKETING_WALLET, 'MARKETING_WALLET');
  const stakingPool = requireAddress(process.env.STAKING_POOL || process.env.STAKING_CONTRACT_ADDRESS, 'STAKING_POOL');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    throw new Error(`Wrong network: expected Base Mainnet ${BASE_CHAIN_ID}, got ${network.chainId}`);
  }

  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  console.log('Updating Aetheron wallets on Base Mainnet...');
  console.log('Token:', CONTRACT_ADDRESS);
  console.log('Team:', teamWallet);
  console.log('Marketing:', marketingWallet);
  console.log('Staking Pool:', stakingPool);

  const tx = await contract.updateWallets(teamWallet, marketingWallet, stakingPool);
  console.log('Transaction hash:', tx.hash);
  await tx.wait();
  console.log('Wallet update confirmed on Base Mainnet.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
