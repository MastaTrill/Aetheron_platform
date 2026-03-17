import fs from 'fs';
import hre from 'hardhat';
import dotenv from 'dotenv';
import { verifyContract } from '@nomicfoundation/hardhat-verify/verify';

dotenv.config();

const cliArgs = process.argv.slice(2);
const allContractTypes = ['Aetheron', 'AetxToken', 'AetheronStaking'];
const explorerBaseUrls = {
  polygon: 'https://polygonscan.com',
  mumbai: 'https://amoy.polygonscan.com',
  goerli: 'https://goerli.etherscan.io',
  mainnet: 'https://etherscan.io',
  sepolia: 'https://sepolia.etherscan.io',
};

const requestedContractTypes = cliArgs.filter((arg) =>
  allContractTypes.includes(arg),
);
const contractTypes =
  requestedContractTypes.length > 0 ? requestedContractTypes : allContractTypes;

const TEAM_WALLET = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';
const MARKETING_WALLET = '0x8D3442424F8F6BEEd97496C7E54e056166f96746';
const STAKING_POOL = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function readContractAddresses(network) {
  const candidateFiles = ['deployment-info.json', 'deployment.json'];

  for (const fileName of candidateFiles) {
    if (!fs.existsSync(fileName)) {
      continue;
    }

    const deploymentData = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    let networkData = deploymentData;

    if (deploymentData.networks?.[network]) {
      networkData = deploymentData.networks[network];
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

function getApiKeyForNetwork(network) {
  if (network === 'polygon' || network === 'mumbai') {
    return process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '';
  }

  return process.env.ETHERSCAN_API_KEY || '';
}

function printVerificationTarget(network, contractType, address, constructorArgs) {
  const explorerBaseUrl = explorerBaseUrls[network] || explorerBaseUrls.polygon;

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
  const network = hre.network.name;
  const results = [];
  const apiKey = getApiKeyForNetwork(network);

  console.log(`\nVerification Run for network: ${network}`);
  console.log('='.repeat(60));

  if (!apiKey) {
    fail(
      `Missing explorer API key for network "${network}". Set ETHERSCAN_API_KEY or POLYGONSCAN_API_KEY before verifying.`,
      2,
    );
  }

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
    printVerificationTarget(network, contractType, address, constructorArgs);

    try {
      await verifyContract(
        {
          address,
          constructorArgs,
          provider: 'etherscan',
        },
        hre,
      );

      results.push({
        network,
        contract: contractType,
        address,
        status: 'verified',
        message: 'Verified through Hardhat verify',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const normalizedMessage = message.toLowerCase();
      const alreadyVerified =
        normalizedMessage.includes('already verified') ||
        normalizedMessage.includes('already been verified') ||
        normalizedMessage.includes('source code already verified');

      results.push({
        network,
        contract: contractType,
        address,
        status: alreadyVerified ? 'already-verified' : 'failed',
        message: alreadyVerified ? 'Explorer already has verified source' : message,
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
