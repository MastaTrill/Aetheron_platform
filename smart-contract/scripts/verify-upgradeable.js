import dotenv from 'dotenv';
import { ethers } from 'ethers';
import {
  getRpcUrl,
  submitProxyVerification,
  submitStandardJsonVerification,
} from '../utils/explorer-verify.mjs';
import { getImplementationAddress } from '../utils/uups.mjs';

dotenv.config();

const DEFAULT_SOURCE_NAME = 'contracts/AetheronMultiSigTreasury.sol';
const DEFAULT_CONTRACT_NAME = 'AetheronMultiSigTreasury';

async function main() {
  const network = process.argv[2];
  const proxyAddress = process.argv[3];
  const sourceName = process.argv[4] || DEFAULT_SOURCE_NAME;
  const contractName = process.argv[5] || DEFAULT_CONTRACT_NAME;

  if (!network || !proxyAddress) {
    throw new Error(
      'Usage: node scripts/verify-upgradeable.js <network> <proxyAddress> [sourceName] [contractName]',
    );
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrl(network));
  const implementationAddress = await getImplementationAddress(provider, proxyAddress);

  console.log('Proxy address:', proxyAddress);
  console.log('Implementation address:', implementationAddress);

  const implementationResult = await submitStandardJsonVerification({
    network,
    sourceName,
    contractName,
    contractAddress: implementationAddress,
    constructorArgs: [],
  });

  console.log(`Implementation verification: ${implementationResult.status}`);
  console.log(implementationResult.message);

  const proxyResult = await submitProxyVerification({
    network,
    proxyAddress,
    expectedImplementation: implementationAddress,
  });

  console.log(`Proxy verification: ${proxyResult.status}`);
  console.log(proxyResult.message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
