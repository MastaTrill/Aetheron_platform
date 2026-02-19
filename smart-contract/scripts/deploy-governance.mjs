import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import fs from 'fs';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DEPLOYING AETHERON GOVERNANCE CONTRACT');
  console.log('='.repeat(60) + '\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log('📍 Deploying from account:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'POL');
  if (balance === 0n) {
    console.error('\n❌ ERROR: Deployer account has no POL!');
    process.exit(1);
  }

  // Get AETH token address from env or prompt
  const AETH_TOKEN_ADDRESS = process.env.AETH_TOKEN_ADDRESS;
  if (
    !AETH_TOKEN_ADDRESS ||
    AETH_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000'
  ) {
    console.error('\n❌ ERROR: Set AETH_TOKEN_ADDRESS in your .env file.');
    process.exit(1);
  }

  // Load contract artifact
  const GovernanceArtifact = JSON.parse(
    fs.readFileSync(
      './artifacts/contracts/AetheronGovernance.sol/AetheronGovernance.json',
      'utf8',
    ),
  );

  // Deploy Governance contract
  console.log('\n━'.repeat(30));
  console.log('STEP: Deploying Governance Contract');
  console.log('━'.repeat(30));

  const GovernanceFactory = new ethers.ContractFactory(
    GovernanceArtifact.abi,
    GovernanceArtifact.bytecode,
    wallet,
  );

  console.log('📤 Sending governance deployment transaction...');
  const governance = await GovernanceFactory.deploy(AETH_TOKEN_ADDRESS);
  console.log('⏳ Waiting for governance deployment...');
  await governance.waitForDeployment();

  const governanceAddress = await governance.getAddress();
  console.log('✅ Governance Contract deployed to:', governanceAddress);

  // Save deployment info
  const deploymentInfo = {
    network: 'polygon',
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      AetheronGovernance: {
        address: governanceAddress,
        args: [AETH_TOKEN_ADDRESS],
      },
    },
  };

  fs.writeFileSync(
    'deployment-governance.json',
    JSON.stringify(deploymentInfo, null, 2),
  );

  console.log('\n' + '='.repeat(60));
  console.log('🎉 GOVERNANCE DEPLOYMENT COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n📁 Deployment info saved to: deployment-governance.json');
  console.log('\n📝 Next Steps:');
  console.log('  1. Verify contract on PolygonScan');
  console.log('  2. Update frontend with new governance address\n');
  console.log('📋 Governance Contract Address:');
  console.log('  Governance:', governanceAddress);
  console.log('\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ DEPLOYMENT FAILED:', error);
    process.exit(1);
  });
