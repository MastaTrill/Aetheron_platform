// scripts/deploy-upgradeable.cjs
// Deploys the AetheronMultiSigTreasury contract as a UUPS upgradeable proxy

async function main() {
  const hre = await import('hardhat');
  const { deployUupsProxy, getImplementationAddress } = await import(
    '../utils/uups.mjs'
  );
  const connection = await hre.default.network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const owners = [deployer.address]; // TODO: Replace with actual multisig owners
  const numConfirmationsRequired = 1; // TODO: Set required confirmations

  const Treasury = await ethers.getContractFactory('AetheronMultiSigTreasury');
  const { proxyAddress } = await deployUupsProxy(Treasury, [
    owners,
    numConfirmationsRequired,
  ]);

  console.log('AetheronMultiSigTreasury (proxy) deployed to:', proxyAddress);
  console.log(
    'Implementation address:',
    await getImplementationAddress(ethers.provider, proxyAddress),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
