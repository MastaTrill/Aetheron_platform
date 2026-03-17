// scripts/deploy-upgradeable.js
// Deploys the AetheronMultiSigTreasury contract as a UUPS upgradeable proxy

import hre from 'hardhat';
import { upgrades } from '@openzeppelin/hardhat-upgrades';

async function main() {
  const connection = await hre.network.connect();
  const { ethers } = connection;
  const upgradesApi = await upgrades(hre, connection);

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const owners = [deployer.address]; // TODO: Replace with actual multisig owners
  const numConfirmationsRequired = 1; // TODO: Set required confirmations

  const Treasury = await ethers.getContractFactory('AetheronMultiSigTreasury');
  const proxy = await upgradesApi.deployProxy(
    Treasury,
    [owners, numConfirmationsRequired],
    {
      initializer: 'initialize',
      kind: 'uups',
    },
  );
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log('AetheronMultiSigTreasury (proxy) deployed to:', proxyAddress);
  console.log(
    'Implementation address:',
    await upgradesApi.erc1967.getImplementationAddress(proxyAddress),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
