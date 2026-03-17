import hre from 'hardhat';
import { verifyContract } from '@nomicfoundation/hardhat-verify/verify';
import { getImplementationAddress } from '../utils/uups.mjs';

async function main() {
  const proxyAddress = process.argv[2];
  if (!proxyAddress) {
    throw new Error(
      'Proxy address required: hardhat run scripts/verify-upgradeable.js --network <network> -- <proxyAddress>',
    );
  }

  const connection = await hre.network.connect();
  const { ethers } = connection;
  const implementationAddress = await getImplementationAddress(
    ethers.provider,
    proxyAddress,
  );

  console.log('Implementation address:', implementationAddress);

  await verifyContract(
    {
      address: implementationAddress,
      constructorArgs: [],
      provider: 'etherscan',
    },
    hre,
  );

  console.log('Verification submitted for implementation contract.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
