import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const cliArgs = process.argv.slice(2);
const allNetworks = ['polygon', 'mumbai', 'goerli', 'mainnet', 'sepolia'];
const allContractTypes = ['Aetheron', 'AetxToken', 'AetheronStaking'];
const explorerBaseUrls = {
  polygon: 'https://polygonscan.com',
  mumbai: 'https://amoy.polygonscan.com',
  goerli: 'https://goerli.etherscan.io',
  mainnet: 'https://etherscan.io',
  sepolia: 'https://sepolia.etherscan.io',
};

let networks = [];
let contractTypes = [];

for (const arg of cliArgs) {
  if (allNetworks.includes(arg.toLowerCase())) {
    networks.push(arg.toLowerCase());
  } else if (allContractTypes.includes(arg)) {
    contractTypes.push(arg);
  }
}

if (networks.length === 0) {
  networks = [process.env.NETWORK || 'polygon'];
}

if (contractTypes.length === 0) {
  contractTypes = allContractTypes;
}

const TEAM_WALLET = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';
const MARKETING_WALLET = '0x8D3442424F8F6BEEd97496C7E54e056166f96746';
const STAKING_POOL = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function readContractAddresses(network) {
  if (fs.existsSync('deployment-info.json')) {
    const deploymentData = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    let networkData = deploymentData;

    if (deploymentData.networks && deploymentData.networks[network]) {
      networkData = deploymentData.networks[network];
    }

    if (
      networkData.contracts?.Aetheron?.address &&
      networkData.contracts?.AetxToken?.address &&
      networkData.contracts?.AetheronStaking?.address
    ) {
      return networkData.contracts;
    }
  }

  return {
    Aetheron: { address: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e' },
    AetxToken: { address: '0x072091F554df794852E0A9d1c809F2B2bBda171E' },
    AetheronStaking: {
      address: '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82',
    },
  };
}

function getConstructorArgs(contractType, contractAddresses) {
  if (contractType === 'Aetheron') {
    return [TEAM_WALLET, MARKETING_WALLET, STAKING_POOL];
  }

  if (contractType === 'AetxToken') {
    return [TEAM_WALLET];
  }

  if (contractType === 'AetheronStaking') {
    return [contractAddresses.Aetheron.address];
  }

  return [];
}

function printManualInstructions(network, contractType, address, constructorArgs) {
  const explorerBaseUrl = explorerBaseUrls[network] || explorerBaseUrls.polygon;

  console.log(`Manual verification steps for ${contractType}:`);
  console.log(`  Explorer page: ${explorerBaseUrl}/address/${address}#code`);
  console.log('  Compiler: v0.8.20');
  console.log('  Optimization: enabled, 200 runs');
  console.log('  License: MIT');
  console.log(
    `  Constructor args: ${
      constructorArgs.length === 0 ? '(none)' : constructorArgs.join(', ')
    }`,
  );
  console.log('');
}

async function main() {
  const results = [];

  for (const network of networks) {
    console.log(`\nVerification Guide for network: ${network}`);
    console.log('='.repeat(60));

    const contractAddresses = readContractAddresses(network);
    if (
      !contractAddresses.Aetheron?.address ||
      !contractAddresses.AetxToken?.address ||
      !contractAddresses.AetheronStaking?.address
    ) {
      fail(`Missing contract addresses for network "${network}".`, 2);
    }

    for (const contractType of contractTypes) {
      const address = contractAddresses[contractType]?.address;
      if (!address) {
        console.error(`Address for ${contractType} not found. Skipping.`);
        continue;
      }

      const constructorArgs = getConstructorArgs(contractType, contractAddresses);
      printManualInstructions(network, contractType, address, constructorArgs);
      results.push({
        network,
        contract: contractType,
        address,
        status: 'manual',
        message: 'Printed manual verification steps',
      });
    }
  }

  console.log('\n===== VERIFICATION SUMMARY =====');
  console.log(
    'Network        Contract         Address                                    Status             Message',
  );
  console.log(
    '-----------------------------------------------------------------------------------------------------------',
  );

  for (const result of results) {
    console.log(
      `${result.network.padEnd(14)} ${result.contract.padEnd(16)} ${result.address.padEnd(
        42,
      )} ${result.status.padEnd(18)} ${result.message}`,
    );
  }

  console.log('===========================================================================================================\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
