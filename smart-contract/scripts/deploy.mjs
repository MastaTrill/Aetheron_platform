import hre from 'hardhat';
import dotenv from 'dotenv';
import fs from 'fs';
import {
  validateOrExit,
  validateBalanceOrExit,
  colors,
} from '../utils/validateEnv.mjs';

dotenv.config();

const BASE_CHAIN_ID = 8453;
const LOCAL_CHAIN_ID = 31337;

async function main() {
  const connection = await hre.network.connect();
  const { ethers } = connection;
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const networkName = connection.networkName || hre.network.name || `chain-${chainId}`;
  const isBaseMainnet = chainId === BASE_CHAIN_ID;

  if (isBaseMainnet && process.env.CONFIRM_BASE_DEPLOYMENT !== 'CONFIRM_BASE_DEPLOYMENT') {
    throw new Error('Refusing Base Mainnet deployment. Set CONFIRM_BASE_DEPLOYMENT=CONFIRM_BASE_DEPLOYMENT for an intentional deployment.');
  }

  validateOrExit({
    requirePrivateKey: chainId !== LOCAL_CHAIN_ID,
    requireRpc: isBaseMainnet,
    requireWallets: true,
    requireTokenAddress: false,
  });

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error('No deployment signer is available');

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Deploying on ${networkName} (chain ${chainId}) with ${deployer.address}`);
  console.log(`Signer balance: ${ethers.formatEther(balance)} ETH`);
  await validateBalanceOrExit(deployer.provider, deployer.address, isBaseMainnet ? '0.003' : '0');

  const teamWallet = process.env.TEAM_WALLET;
  const marketingWallet = process.env.MARKETING_WALLET;

  const Aetheron = await ethers.getContractFactory('contracts/Aetheron.sol:Aetheron');
  const aetheron = await Aetheron.deploy(teamWallet, marketingWallet, deployer.address);
  await aetheron.waitForDeployment();
  const aetheronAddress = await aetheron.getAddress();
  console.log(`${colors.green}AETH deployed: ${aetheronAddress}${colors.reset}`);

  const AetheronStaking = await ethers.getContractFactory('contracts/AetheronStaking.sol:AetheronStaking');
  const staking = await AetheronStaking.deploy(aetheronAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`${colors.green}Staking deployed: ${stakingAddress}${colors.reset}`);

  const updateTx = await aetheron.updateWallets(teamWallet, marketingWallet, stakingAddress);
  await updateTx.wait();

  const excludeTx = await aetheron.setExcludedFromTax(stakingAddress, true);
  await excludeTx.wait();

  const configuredRewards = String(process.env.INITIAL_STAKING_REWARDS_AETH || '0');
  const rewards = ethers.parseUnits(configuredRewards, 18);
  if (rewards > 0n) {
    const approveTx = await aetheron.approve(stakingAddress, rewards);
    await approveTx.wait();
    const depositTx = await staking.depositRewards(rewards);
    await depositTx.wait();
    console.log(`Deposited ${configuredRewards} AETH as initial staking rewards.`);
  }

  const deploymentInfo = {
    network: networkName,
    chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      Aetheron: aetheronAddress,
      AetheronStaking: stakingAddress,
    },
    wallets: {
      team: teamWallet,
      marketing: marketingWallet,
      deployer: deployer.address,
    },
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to deployment.json.');

  if (isBaseMainnet) {
    console.log(`AETH: https://basescan.org/address/${aetheronAddress}`);
    console.log(`Staking: https://basescan.org/address/${stakingAddress}`);
    console.log('Trading remains disabled unless the separately gated enable-trading script is intentionally executed.');
  }
}

main().catch((error) => {
  console.error(`${colors.red}${error.message}${colors.reset}`);
  process.exit(1);
});
