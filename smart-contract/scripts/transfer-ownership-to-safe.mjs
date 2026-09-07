import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  callViewWithRetry,
  providerReadWithRetry,
  readWithRetry
} from './lib/base-read-retry.mjs';

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const CANONICAL_AETH = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';

const TOKEN_ABI = [
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner) external'
];

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

  const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
    staticNetwork: true,
    batchMaxCount: 1
  });

  const network = await readWithRetry(
    () => provider.getNetwork(),
    'Base network',
    { validate: (value) => value && value.chainId !== undefined }
  );

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error('Expected Base chain 8453, received ' + network.chainId);
  }

  const token = new ethers.Contract(CANONICAL_AETH, TOKEN_ABI, provider);
  const currentOwner = await callViewWithRetry(token, 'owner', [], 'AETH owner()');

  const safeAddress = process.env.SAFE_ADDRESS || process.argv.find(a => a.startsWith('--safe='))?.split('=')[1];

  console.log('=== Base Mainnet Token Ownership Transfer (Safe) ===');
  console.log('Network:            Base Mainnet (Chain ID 8453)');
  console.log('Target Token:       Canonical AETH (' + CANONICAL_AETH + ')');
  console.log('Current Owner:      ' + currentOwner);
  console.log('Target Safe:        ' + (safeAddress || '(none specified)'));

  if (!safeAddress || !ethers.isAddress(safeAddress)) {
    console.log('\n[INFO] Specify a valid Safe address with --safe=0x... or SAFE_ADDRESS environment variable.');
    return;
  }

  if (safeAddress.toLowerCase() === currentOwner.toLowerCase()) {
    console.log('\n[INFO] Token owner is already set to ' + safeAddress);
    return;
  }

  const code = await providerReadWithRetry(provider, 'getCode', [safeAddress], 'Safe contract bytecode');
  if (code === '0x' || !code) {
    console.warn('\n[WARNING] Address ' + safeAddress + ' has no contract bytecode on Base Mainnet. Ensure the Safe is deployed first.');
  } else {
    console.log('Safe Bytecode:      Verified contract on Base Mainnet.');
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] Preflight verification complete. No ownership changes were broadcast.');
    console.log('To execute transfer on Base Mainnet, run:');
    console.log('  PRIVATE_KEY=<owner_key>');
    console.log('  CONFIRM_OWNERSHIP_TRANSFER=CONFIRM_SAFE_TRANSFER_BASE');
    console.log('  SAFE_ADDRESS=' + safeAddress);
    console.log('  node smart-contract/scripts/transfer-ownership-to-safe.mjs --execute');
    return;
  }

  if (process.env.CONFIRM_OWNERSHIP_TRANSFER !== 'CONFIRM_SAFE_TRANSFER_BASE') {
    throw new Error('Refusing live execution: CONFIRM_OWNERSHIP_TRANSFER must equal CONFIRM_SAFE_TRANSFER_BASE');
  }

  const privateKey = process.env.BASE_DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required for live ownership transfer');

  const signer = new ethers.Wallet(privateKey, provider);
  if (signer.address.toLowerCase() !== currentOwner.toLowerCase()) {
    throw new Error('Signer ' + signer.address + ' is not the current AETH owner ' + currentOwner);
  }

  console.log('\nBroadcasting transferOwnership(' + safeAddress + ')...');
  const tokenWithSigner = token.connect(signer);
  const tx = await tokenWithSigner.transferOwnership(safeAddress);
  console.log('Transaction sent: ' + tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed in block ' + receipt.blockNumber);

  const newOwner = await callViewWithRetry(token, 'owner', [], 'New AETH owner()');
  console.log('New On-Chain Owner: ' + newOwner);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
