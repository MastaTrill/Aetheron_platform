// scripts/deploy-upgradeable.js
// Deploys the AetheronMultiSigTreasury contract as a UUPS upgradeable proxy

const { ethers, upgrades } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const owners = [deployer.address]; // TODO: Replace with actual multisig owners
  const numConfirmationsRequired = 1; // TODO: Set required confirmations

  const Treasury = await ethers.getContractFactory('AetheronMultiSigTreasury');
  const proxy = await upgrades.deployProxy(
    Treasury,
    [owners, numConfirmationsRequired],
    {
      initializer: 'initialize',
      kind: 'uups',
    },
  );
  await proxy.deployed();

  console.log('AetheronMultiSigTreasury (proxy) deployed to:', proxy.address);
  console.log(
    'Implementation address:',
    await upgrades.erc1967.getImplementationAddress(proxy.address),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
