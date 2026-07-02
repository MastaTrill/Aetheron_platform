import fs from 'fs';
import dotenv from 'dotenv';
import {
  submitStandardJsonVerification,
  NETWORK_CONFIG,
} from '../utils/explorer-verify.mjs';

dotenv.config();

const cliArgs = process.argv.slice(2);
const allNetworks = ['polygon', 'mumbai', 'mainnet', 'sepolia'];
const allContractTypes = ['Aetheron', 'AetxToken', 'AetheronStaking'];
const contractDefinitions = {
  Aetheron: {
    sourceName: 'project/contracts/Aetheron.sol',
    contractName: 'Aetheron',
  },
  AetxToken: {
    sourceName: 'project/contracts/AetxToken.sol',
    contractName: 'AetxToken',
  },
  AetheronStaking: {
    sourceName: 'project/contracts/AetheronStaking.sol',
    contractName: 'AetheronStaking',
  },
};

let network = process.env.NETWORK || 'polygon';
let contractTypes = [];

for (const arg of cliArgs) {
  if (allNetworks.includes(arg.toLowerCase())) {
    network = arg.toLowerCase();
  } else if (allContractTypes.includes(arg)) {
    contractTypes.push(arg);
  }
}

if (contractTypes.length === 0) {
  contractTypes = allContractTypes;
}

const TEAM_WALLET = '0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa';
const MARKETING_WALLET = '0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa';
const STAKING_POOL = '0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa';

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function readContractAddresses(selectedNetwork) {
  const candidateFiles = ['deployment-info.json', 'deployment.json'];

  for (const fileName of candidateFiles) {
    if (!fs.existsSync(fileName)) {
      continue;
    }

    const deploymentData = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    let networkData = deploymentData;

    if (deploymentData.networks?.[selectedNetwork]) {
      networkData = deploymentData.networks[selectedNetwork];
    }

    if (
      networkData.contracts?.Aetheron?.address &&
      networkData.contracts?.AetxToken?.address &&
      networkData.contracts?.AetheronStaking?.address
    ) {
      return networkData.contracts;
    }

    if (
      networkData.contracts?.Aetheron &&
      networkData.contracts?.AetheronStaking
    ) {
      return {
        Aetheron: { address: networkData.contracts.Aetheron },
        AetxToken: {
          address: deploymentData.contracts?.AetxToken || process.env.AETH_TOKEN_ADDRESS,
        },
        AetheronStaking: { address: networkData.contracts.AetheronStaking },
      };
    }
  }

  return {
    Aetheron: { address: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e' },
    AetxToken: { address: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e' },
    // AetheronStaking address varies per deployment - requires deployment-info.json
    // Placeholder address below should be updated after actual deployment
    AetheronStaking: {
      address: process.env.AETHERON_STAKING_ADDRESS || '0x0000000000000000000000000000000000000000',
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

function printVerificationTarget(contractType, address, constructorArgs) {
  const explorerBaseUrl = NETWORK_CONFIG[network]?.explorerBaseUrl || NETWORK_CONFIG.polygon.explorerBaseUrl;

  console.log(`Verification target for ${contractType}:`);
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
  const contractAddresses = readContractAddresses(network);
  const results = [];

  if (
    !contractAddresses.Aetheron?.address ||
    !contractAddresses.AetxToken?.address ||
    !contractAddresses.AetheronStaking?.address
  ) {
    fail(`Missing contract addresses for network "${network}".`, 2);
  }

  console.log(`\nVerification Run for network: ${network}`);
  console.log('='.repeat(60));

  for (const contractType of contractTypes) {
    const address = contractAddresses[contractType]?.address;
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      results.push({
        network,
        contract: contractType,
        address: address || '(missing)',
        status: 'skipped',
        message: contractType === 'AetheronStaking' 
          ? 'Set AETHERON_STAKING_ADDRESS in .env after deployment'
          : 'Contract address not configured',
      });
      continue;
    }

    const constructorArgs = getConstructorArgs(contractType, contractAddresses);
    const definition = contractDefinitions[contractType];
    printVerificationTarget(contractType, address, constructorArgs);

    try {
      const result = await submitStandardJsonVerification({
        network,
        sourceName: definition.sourceName,
        contractName: definition.contractName,
        contractAddress: address,
        constructorArgs,
      });

      results.push({
        network,
        contract: contractType,
        address,
        status: result.status,
        message: result.message,
      });
    } catch (error) {
      results.push({
        network,
        contract: contractType,
        address,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
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
