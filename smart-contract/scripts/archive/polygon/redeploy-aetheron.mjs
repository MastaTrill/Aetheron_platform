import hre from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();
import {
  validateOrExit,
  validateBalanceOrExit,
  colors,
} from '../utils/validateEnv.mjs';
import fs from 'fs';

const NEW_OWNER = process.env.NEW_OWNER_ADDRESS;
const TEAM_WALLET = process.env.TEAM_WALLET;
const MARKETING_WALLET = process.env.MARKETING_WALLET;
const STAKING_POOL = process.env.STAKING_POOL;
const AETHERON_STAKING_ADDRESS = process.env.AETHERON_STAKING_ADDRESS;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon.drpc.org';

async function main() {
  console.log(
    '\n' +
      colors.bold +
      colors.red +
      '⚠️  FRESH AETHERON REDEPLOYMENT — THIS IS A NEW TOKEN CONTRACT' +
      colors.reset,
  );
  console.log(
    colors.yellow +
      'Old token: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e (do NOT mix balances/liquidity)' +
      colors.reset,
  );
  console.log('='.repeat(60) + '\n');

  if (!NEW_OWNER || NEW_OWNER === '0x0000000000000000000000000000000000000000') {
    console.error(colors.red + 'NEW_OWNER_ADDRESS must be set in .env' + colors.reset);
    process.exit(1);
  }
  if (!TEAM_WALLET || !MARKETING_WALLET || !STAKING_POOL) {
    console.error(colors.red + 'TEAM_WALLET, MARKETING_WALLET, and STAKING_POOL are required in .env' + colors.reset);
    process.exit(1);
  }

  const connection = await hre.network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', colors.cyan + deployer.address + colors.reset);
  console.log('New Owner:', colors.cyan + NEW_OWNER + colors.reset);

  if (deployer.address.toLowerCase() !== NEW_OWNER.toLowerCase()) {
    console.error(
      colors.red +
        'Deployer wallet does not match NEW_OWNER_ADDRESS. ' +
        'Switch PRIVATE_KEY to the new owner.' +
        colors.reset,
    );
    process.exit(1);
  }

  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInEther = ethers.formatEther(balance);
  console.log('Balance:', colors.cyan + balanceInEther + ' POL' + colors.reset);

  await validateBalanceOrExit(deployer.provider, deployer.address, '0.1');

  console.log('\n' + colors.bold + '📋 Redeployment Configuration:' + colors.reset);
  console.log('  New Owner:', colors.cyan + NEW_OWNER + colors.reset);
  console.log('  Team Wallet:', colors.cyan + TEAM_WALLET + colors.reset);
  console.log('  Marketing Wallet:', colors.cyan + MARKETING_WALLET + colors.reset);
  console.log('  Staking Pool:', colors.cyan + STAKING_POOL + colors.reset);
  console.log('  Existing Staking Contract:', AETHERON_STAKING_ADDRESS || '(not linked)');
  console.log('');

  console.log(colors.bold + '📜 Deploying FRESH Aetheron Token...' + colors.reset);
  const Aetheron = await ethers.getContractFactory('contracts/Aetheron.sol:Aetheron');
  const aetheron = await Aetheron.deploy(TEAM_WALLET, MARKETING_WALLET, STAKING_POOL);
  await aetheron.waitForDeployment();
  const aetheronAddress = await aetheron.getAddress();
  console.log(colors.green + '✅ New Aetheron Token deployed to: ' + aetheronAddress + colors.reset);

  console.log('\n' + colors.bold + '📜 Deploying Aetheron Staking...' + colors.reset);
  const AetheronStaking = await ethers.getContractFactory('contracts/AetheronStaking.sol:AetheronStaking');
  const staking = await AetheronStaking.deploy(aetheronAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(colors.green + '✅ Staking deployed to: ' + stakingAddress + colors.reset);

  console.log('\n🔄 Updating staking pool address in new token contract...');
  const updateTx = await aetheron.updateWallets(TEAM_WALLET, MARKETING_WALLET, stakingAddress);
  await updateTx.wait();
  console.log(colors.green + '✅ Staking pool address updated on new token' + colors.reset);

  const stakingRewards = ethers.parseEther('1000000');
  console.log('📝 Approving staking contract for rewards...');
  const approveTx = await aetheron.approve(stakingAddress, stakingRewards);
  await approveTx.wait();
  console.log(colors.green + '✅ Staking contract approved' + colors.reset);

  console.log('💰 Depositing 1,000,000 AETH rewards...');
  const depositTx = await staking.depositRewards(stakingRewards);
  await depositTx.wait();
  console.log(colors.green + '✅ Rewards deposited' + colors.reset);

  console.log('🔧 Excluding staking contract from tax...');
  const excludeTx = await aetheron.setExcludedFromTax(stakingAddress, true);
  await excludeTx.wait();
  console.log(colors.green + '✅ Staking excluded from tax' + colors.reset);

  console.log('\n============================================================');
  console.log(colors.bold + colors.green + '🎉 FRESH REDEPLOYMENT COMPLETE' + colors.reset);
  console.log('============================================================');
  console.log('\n' + colors.bold + '📋 New Contract Addresses:' + colors.reset);
  console.log('  New AETH Token:', colors.cyan + aetheronAddress + colors.reset);
  console.log('  Staking:', colors.cyan + stakingAddress + colors.reset);
  console.log('  New Owner:', colors.cyan + NEW_OWNER + colors.reset);
  console.log('\n' + colors.red + '⚠️  Do NOT reuse the old token/addresses/UI configs.' + colors.reset);
  console.log('============================================================\n');

  const redeploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    redeploymentOf: 'Aetheron',
    status: 'fresh-deploy',
    contracts: {
      Aetheron: { address: aetheronAddress, owner: NEW_OWNER },
      AetheronStaking: { address: stakingAddress },
    },
    wallets: {
      owner: NEW_OWNER,
      team: TEAM_WALLET,
      marketing: MARKETING_WALLET,
      stakingPool: STAKING_POOL,
    },
    note: 'This is a new token contract. Do not mix liquidity/DEX/presale config with legacy deployment.',
  };

  fs.writeFileSync('redeployment.json', JSON.stringify(redeploymentInfo, null, 2));
  console.log('💾 Redeployment info saved to redeployment.json\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n' + colors.red + '❌ REDEPLOYMENT FAILED!' + colors.reset);
    console.error(colors.red + error.message + colors.reset);
    process.exit(1);
  });
