// scripts/verify-upgradeable.js
// Verifies the implementation contract behind the proxy on Etherscan

const { run, upgrades } = require('hardhat');

async function main() {
  const proxyAddress = process.argv[2];
  if (!proxyAddress) {
    throw new Error(
      'Proxy address required: node scripts/verify-upgradeable.js <proxyAddress>',
    );
  }
  const implAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress,
  );
  console.log('Implementation address:', implAddress);

  // The constructor args for implementation are empty (UUPS pattern)
  await run('verify:verify', {
    address: implAddress,
    constructorArguments: [],
  });
  console.log('Verification submitted for implementation contract.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
