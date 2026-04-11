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
    sourceName: 'contracts/Aetheron.sol',
    contractName: 'Aetheron',
  },
  AetxToken: {
    sourceName: 'contracts/AetxToken.sol',
    contractName: 'AetxToken',
  },
  AetheronStaking: {
    sourceName: 'contracts/AetheronStaking.sol',
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

const TEAM_WALLET = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';
const MARKETING_WALLET = '0x8D3442424F8F6BEEd97496C7E54e056166f96746';
const STAKING_POOL = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';

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
    if (!address) {
      results.push({
        network,
        contract: contractType,
        address: '(missing)',
        status: 'failed',
        message: 'Contract address not found',
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
