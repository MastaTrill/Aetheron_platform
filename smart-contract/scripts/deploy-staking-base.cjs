// scripts/deploy-staking-base.cjs
// Deploys AetheronStaking contract to Base network

const { ethers } = require('hardhat');

async function main() {
  const TOKEN_ADDRESS = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
  const TREASURY_ADDRESS =
    '0x3cbe61e7f4473e409e6d499af4cd10f9a35fa7818cf86c06fd563057fda2cb55';

  const [deployer] = await ethers.getSigners();
  console.log('Deploying staking contract with account:', deployer.address);

  const Staking = await ethers.getContractFactory('AetheronStaking');
  const staking = await Staking.deploy(TOKEN_ADDRESS);
  await staking.deployed();

  console.log('AetheronStaking deployed to:', staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
