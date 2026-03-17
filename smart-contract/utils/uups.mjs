import { createRequire } from 'node:module';
import { ethers } from 'ethers';

const require = createRequire(import.meta.url);
const erc1967ProxyArtifact = require('@openzeppelin/contracts/build/contracts/ERC1967Proxy.json');

const IMPLEMENTATION_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

export async function getImplementationAddress(provider, proxyAddress) {
  const rawValue = await provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
  return ethers.getAddress(`0x${rawValue.slice(-40)}`);
}

export async function deployUupsProxy(
  implementationFactory,
  initializerArgs = [],
  options = {},
) {
  const initializer = options.initializer ?? 'initialize';
  const implementation = await implementationFactory.deploy();
  await implementation.waitForDeployment();

  const implementationAddress = await implementation.getAddress();
  const initData = implementationFactory.interface.encodeFunctionData(
    initializer,
    initializerArgs,
  );

  const proxyFactory = new ethers.ContractFactory(
    erc1967ProxyArtifact.abi,
    erc1967ProxyArtifact.bytecode,
    implementationFactory.runner,
  );
  const proxy = await proxyFactory.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();

  return {
    implementation,
    implementationAddress,
    proxy,
    proxyAddress,
    instance: implementationFactory.attach(proxyAddress),
  };
}
