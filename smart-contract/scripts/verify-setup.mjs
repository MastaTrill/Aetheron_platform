import dotenv from 'dotenv';
import fs from 'fs';
import { ethers } from 'ethers';
import {
  validateEnvironment,
  validateRpcConnection,
  checkBalance,
  colors,
} from '../utils/validateEnv.mjs';

dotenv.config();

const BASE_CHAIN_ID = 8453;

function report(label, ok, details = '') {
  const marker = ok ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
  console.log(`${marker} ${label}${details ? ` — ${details}` : ''}`);
}

async function main() {
  let failed = false;
  console.log(`${colors.bold}Aetheron Base Mainnet setup verification${colors.reset}`);

  const envExists = fs.existsSync('.env');
  report('.env file', envExists, envExists ? 'present' : 'missing');
  failed ||= !envExists;

  const envValidation = validateEnvironment({
    requirePrivateKey: true,
    requireRpc: true,
    requireWallets: true,
    requireTokenAddress: false,
    silent: true,
  });

  for (const error of envValidation.errors) {
    report(error.field, false, error.message);
    failed = true;
  }
  for (const warning of envValidation.warnings) {
    console.log(`${colors.yellow}WARN${colors.reset} ${warning.field} — ${warning.message}`);
  }

  if (process.env.BASE_RPC_URL) {
    const rpc = await validateRpcConnection(process.env.BASE_RPC_URL, BASE_CHAIN_ID);
    report(
      'Base Mainnet RPC',
      rpc.connected && rpc.chainId === BASE_CHAIN_ID,
      rpc.connected
        ? `chainId ${rpc.chainId}, block ${rpc.blockNumber}`
        : rpc.error || 'connection failed',
    );
    failed ||= !rpc.connected || rpc.chainId !== BASE_CHAIN_ID;

    if (rpc.connected && process.env.PRIVATE_KEY && /^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY)) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const balance = await checkBalance(provider, wallet.address, '0.001');
        report(
          'Deployer Base ETH balance',
          !balance.error && balance.sufficient,
          balance.error || `${balance.balance} ETH`,
        );
        failed ||= Boolean(balance.error) || !balance.sufficient;
      } catch (error) {
        report('Deployer wallet', false, error.message);
        failed = true;
      }
    }
  }

  const artifactPath = 'artifacts/contracts/Aetheron.sol/Aetheron.json';
  const artifactExists = fs.existsSync(artifactPath);
  report('Aetheron compile artifact', artifactExists, artifactExists ? artifactPath : 'run npm run compile');
  failed ||= !artifactExists;

  if (process.env.AETH_TOKEN_ADDRESS) {
    const valid = ethers.isAddress(process.env.AETH_TOKEN_ADDRESS);
    report('AETH_TOKEN_ADDRESS', valid, valid ? process.env.AETH_TOKEN_ADDRESS : 'invalid address');
    failed ||= !valid;
  } else {
    console.log(`${colors.yellow}WARN${colors.reset} AETH_TOKEN_ADDRESS — not set (required for post-deployment operations)`);
  }

  console.log('Canonical production network: Base Mainnet (chain ID 8453).');
  console.log('Deploy with: npx hardhat run scripts/deploy.mjs --network base');
  console.log('Base writes remain confirmation-gated; this verification script never sends transactions.');

  if (failed) {
    throw new Error('Base setup verification failed');
  }
}

main().catch((error) => {
  console.error(`${colors.red}${error.message}${colors.reset}`);
  process.exit(1);
});
