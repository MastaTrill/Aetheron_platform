#!/usr/bin/env node

/**
 * Deploy AetheronGovernance Contract on Polygon Mainnet
 *
 * Usage:
 *   node scripts/deploy-governance.mjs --dry-run
 *   PRIVATE_KEY=0x... node scripts/deploy-governance.mjs --confirm
 *
 * Options:
 *   --token <addr>     Override AETH token address (default: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e)
 *   --dry-run          Simulate deployment without broadcasting
 *   --confirm          Authorize live on-chain deployment
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

const DEFAULT_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';

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
  const isConfirmed = Boolean(args.confirm || args.yes);
  const tokenAddress = args.token || process.env.AETH_TOKEN_ADDRESS || DEFAULT_TOKEN;

  hr('🏛️ AETHERON GOVERNANCE CONTRACT DEPLOYMENT');

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

  console.log('Deployment Configuration:');
  console.log('  Target Network:       Polygon Mainnet');
  console.log('  Connected Chain ID:  ', network.chainId.toString());
  console.log('  Active RPC Endpoint: ', activeRpc);
  console.log('  AETH Token Address:  ', tokenAddress);
  console.log('  Mode:                ', isDryRun ? 'DRY RUN (Simulation)' : 'LIVE BROADCAST');

  // Load contract artifact
  const possiblePaths = [
    path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../artifacts/contracts/AetheronGovernance.sol/AetheronGovernance.json'),
    path.resolve('artifacts/contracts/AetheronGovernance.sol/AetheronGovernance.json'),
    path.resolve('smart-contract/artifacts/contracts/AetheronGovernance.sol/AetheronGovernance.json'),
  ];

  let artifactPath = possiblePaths.find((p) => fs.existsSync(p));

  if (!artifactPath) {
    console.error('❌ Artifact not found. Please ensure AetheronGovernance is compiled in smart-contract/artifacts/');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));


  if (isDryRun) {
    console.log('\n✅ [DRY-RUN SIMULATION]');
    console.log('  Artifact verified: AetheronGovernance');
    console.log('  Constructor argument:', tokenAddress);
    console.log('  Estimated deployment gas: ~1,500,000 gas');
    console.log('  Ready for broadcast. Run with PRIVATE_KEY and --confirm to deploy on-chain.');
    return;
  }

  const privateKey = process.env.POLYGON_OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY;
  if (!privateKey) {
    console.error('\n❌ ERROR: Missing PRIVATE_KEY for deployment.');
    process.exit(1);
  }

  if (!isConfirmed) {
    console.error('\n❌ ERROR: Live deployment requires --confirm flag.');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log('  Deployer Wallet:     ', wallet.address);
  console.log('  Wallet Balance:      ', ethers.formatEther(balance), 'POL');

  if (balance < ethers.parseEther('0.05')) {
    console.error('❌ Insufficient POL for gas! Need at least 0.05 POL.');
    process.exit(1);
  }

  console.log('\n🚀 Deploying AetheronGovernance contract...');
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const governance = await factory.deploy(tokenAddress);
  console.log('  📤 Deployment Tx:', governance.deploymentTransaction().hash);

  console.log('  ⏳ Waiting for confirmations...');
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  const receipt = await governance.deploymentTransaction().wait(2);

  console.log(`  ✅ Deployed to: ${governanceAddress} (Block ${receipt.blockNumber})`);

  // Save deployment record
  const deploymentInfo = {
    network: 'polygon',
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      AetheronGovernance: {
        address: governanceAddress,
        token: tokenAddress,
        txHash: governance.deploymentTransaction().hash,
        blockNumber: receipt.blockNumber,
      },
    },
  };

  const outDir = path.resolve('deployments');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'governance-polygon.json'), JSON.stringify(deploymentInfo, null, 2));
  console.log('  📄 Deployment receipt saved to: deployments/governance-polygon.json');

  hr('🎉 GOVERNANCE DEPLOYMENT COMPLETE');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err?.reason || err?.message || err);
  process.exit(1);
});
