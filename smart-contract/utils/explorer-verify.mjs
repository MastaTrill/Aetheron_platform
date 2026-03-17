import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const BUILD_INFO_DIR = path.resolve('artifacts', 'build-info');
const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';

export const NETWORK_CONFIG = {
  polygon: {
    chainId: '137',
    explorerBaseUrl: 'https://polygonscan.com',
    rpcUrlEnv: 'POLYGON_RPC_URL',
  },
  mumbai: {
    chainId: '80002',
    explorerBaseUrl: 'https://amoy.polygonscan.com',
    rpcUrlEnv: 'MUMBAI_RPC_URL',
  },
  sepolia: {
    chainId: '11155111',
    explorerBaseUrl: 'https://sepolia.etherscan.io',
    rpcUrlEnv: 'SEPOLIA_RPC_URL',
  },
  mainnet: {
    chainId: '1',
    explorerBaseUrl: 'https://etherscan.io',
    rpcUrlEnv: 'MAINNET_RPC_URL',
  },
};

function fail(message) {
  throw new Error(message);
}

function loadBuildInfos() {
  if (!fs.existsSync(BUILD_INFO_DIR)) {
    fail('Build info not found. Run `npm run compile` in smart-contract first.');
  }

  return fs
    .readdirSync(BUILD_INFO_DIR)
    .filter((fileName) => fileName.endsWith('.json') && !fileName.endsWith('.output.json'))
    .map((inputFileName) => {
      const inputPath = path.join(BUILD_INFO_DIR, inputFileName);
      const outputPath = inputPath.replace(/\.json$/, '.output.json');

      if (!fs.existsSync(outputPath)) {
        fail(`Missing build output file for ${inputFileName}.`);
      }

      return {
        input: JSON.parse(fs.readFileSync(inputPath, 'utf8')),
        output: JSON.parse(fs.readFileSync(outputPath, 'utf8')),
      };
    });
}

export function getNetworkConfig(network) {
  const config = NETWORK_CONFIG[network];
  if (!config) {
    fail(`Unsupported network "${network}".`);
  }

  return config;
}

export function getExplorerApiKey(network) {
  const key =
    process.env.ETHERSCAN_API_KEY ||
    (network === 'polygon' || network === 'mumbai'
      ? process.env.POLYGONSCAN_API_KEY
      : '');

  if (!key) {
    fail(
      `Missing explorer API key for ${network}. Set ETHERSCAN_API_KEY or POLYGONSCAN_API_KEY.`,
    );
  }

  return key;
}

export function getRpcUrl(network) {
  const config = getNetworkConfig(network);
  const rpcUrl = process.env[config.rpcUrlEnv];

  if (!rpcUrl) {
    fail(`Missing RPC URL for ${network}. Set ${config.rpcUrlEnv}.`);
  }

  return rpcUrl;
}

export function findContractBuildInfo(sourceName, contractName) {
  const buildInfos = loadBuildInfos();

  for (const buildInfo of buildInfos) {
    const contractOutput = buildInfo.output.output?.contracts?.[sourceName]?.[contractName];
    if (!contractOutput) {
      continue;
    }

    return {
      sourceName,
      contractName,
      input: buildInfo.input,
      output: buildInfo.output,
      contractOutput,
    };
  }

  fail(`Build info for ${sourceName}:${contractName} not found.`);
}

export function encodeConstructorArguments(abi, constructorArgs = []) {
  if (constructorArgs.length === 0) {
    return '';
  }

  const constructorAbi = abi.find((item) => item.type === 'constructor');
  if (!constructorAbi) {
    fail('Constructor ABI not found, but constructor arguments were provided.');
  }

  const types = constructorAbi.inputs.map((input) => input.type);
  return ethers.AbiCoder.defaultAbiCoder().encode(types, constructorArgs).replace(/^0x/, '');
}

async function explorerRequest(searchParams, method = 'POST') {
  const url =
    method === 'GET'
      ? `${ETHERSCAN_API_URL}?${searchParams.toString()}`
      : ETHERSCAN_API_URL;

  const response = await fetch(url, {
    method,
    headers:
      method === 'POST'
        ? {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          }
        : undefined,
    body: method === 'POST' ? searchParams : undefined,
  });

  if (!response.ok) {
    fail(`Explorer API request failed with status ${response.status}.`);
  }

  return response.json();
}

async function pollStatus({
  apiKey,
  chainId,
  guid,
  statusAction,
  successMessages,
}) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const params = new URLSearchParams({
      apikey: apiKey,
      chainid: chainId,
      module: 'contract',
      action: statusAction,
      guid,
    });

    const result = await explorerRequest(params, 'GET');
    const message = `${result.result || result.message || ''}`.toLowerCase();

    if (result.status === '1' || successMessages.some((item) => message.includes(item))) {
      return {
        status: 'verified',
        message: result.result || result.message || 'Verification completed',
      };
    }

    if (
      message.includes('pending') ||
      message.includes('in queue') ||
      message.includes('submitted')
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    throw new Error(result.result || result.message || 'Verification failed');
  }

  throw new Error('Verification status polling timed out.');
}

export async function submitStandardJsonVerification({
  network,
  sourceName,
  contractName,
  contractAddress,
  constructorArgs = [],
}) {
  const apiKey = getExplorerApiKey(network);
  const { chainId } = getNetworkConfig(network);
  const buildInfo = findContractBuildInfo(sourceName, contractName);
  const constructorArguments = encodeConstructorArguments(
    buildInfo.contractOutput.abi,
    constructorArgs,
  );
  const params = new URLSearchParams({
    apikey: apiKey,
    chainid: chainId,
    module: 'contract',
    action: 'verifysourcecode',
    codeformat: 'solidity-standard-json-input',
    contractaddress: contractAddress,
    sourceCode: JSON.stringify(buildInfo.input.input),
    contractname: `${sourceName}:${contractName}`,
    compilerversion: `v${buildInfo.input.solcLongVersion}`,
    optimizationUsed: buildInfo.input.input.settings.optimizer?.enabled ? '1' : '0',
    runs: `${buildInfo.input.input.settings.optimizer?.runs ?? 0}`,
    constructorArguments,
    evmversion: buildInfo.input.input.settings.evmVersion || 'default',
    licenseType: '3',
  });

  const submitResult = await explorerRequest(params, 'POST');
  const submitMessage = `${submitResult.result || submitResult.message || ''}`.toLowerCase();

  if (
    submitMessage.includes('already verified') ||
    submitMessage.includes('source code already verified')
  ) {
    return {
      status: 'already-verified',
      message: submitResult.result || 'Source code already verified',
    };
  }

  if (submitResult.status !== '1' || !submitResult.result) {
    throw new Error(submitResult.result || submitResult.message || 'Verification failed');
  }

  return pollStatus({
    apiKey,
    chainId,
    guid: submitResult.result,
    statusAction: 'checkverifystatus',
    successMessages: ['pass - verified'],
  });
}

export async function submitProxyVerification({
  network,
  proxyAddress,
  expectedImplementation,
}) {
  const apiKey = getExplorerApiKey(network);
  const { chainId } = getNetworkConfig(network);
  const params = new URLSearchParams({
    apikey: apiKey,
    chainid: chainId,
    module: 'contract',
    action: 'verifyproxycontract',
    address: proxyAddress,
    expectedimplementation: expectedImplementation,
  });

  const submitResult = await explorerRequest(params, 'POST');
  const submitMessage = `${submitResult.result || submitResult.message || ''}`.toLowerCase();

  if (
    submitMessage.includes('already verified') ||
    submitMessage.includes('proxy already verified')
  ) {
    return {
      status: 'already-verified',
      message: submitResult.result || 'Proxy already verified',
    };
  }

  if (submitResult.status !== '1' || !submitResult.result) {
    throw new Error(submitResult.result || submitResult.message || 'Proxy verification failed');
  }

  return pollStatus({
    apiKey,
    chainId,
    guid: submitResult.result,
    statusAction: 'checkproxyverification',
    successMessages: ['pass - verified'],
  });
}
