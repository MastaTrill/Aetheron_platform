import { ethers } from 'ethers';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function validatePrivateKey(privateKey) {
  if (!privateKey) {
    return { valid: false, error: 'PRIVATE_KEY is not defined' };
  }

  const normalized = privateKey.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    return {
      valid: false,
      error: 'PRIVATE_KEY must be a 0x-prefixed 32-byte hexadecimal value',
    };
  }

  if (/^0x0{64}$/i.test(normalized) || /^0x1{64}$/i.test(normalized)) {
    return { valid: false, error: 'PRIVATE_KEY appears to be a placeholder value' };
  }

  return { valid: true };
}

function validateAddress(address, varName = 'ADDRESS') {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: `${varName} is not defined` };
  }

  if (address !== address.trim()) {
    return { valid: false, error: `${varName} contains surrounding whitespace` };
  }

  if (!ethers.isAddress(address)) {
    return { valid: false, error: `${varName} is not a valid EVM address` };
  }

  if (address.toLowerCase() === ethers.ZeroAddress.toLowerCase()) {
    return { valid: false, error: `${varName} cannot be the zero address` };
  }

  return { valid: true };
}

function validateRpcUrl(url, varName = 'BASE_RPC_URL') {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: `${varName} is not defined` };
  }

  if (url !== url.trim()) {
    return { valid: false, error: `${varName} contains surrounding whitespace` };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: `${varName} must use http:// or https://` };
    }
  } catch (error) {
    return { valid: false, error: `${varName} is not a valid URL: ${error.message}` };
  }

  return { valid: true };
}

function addValidationResult(collection, field, result) {
  if (!result.valid) {
    collection.push({ field, message: result.error });
  }
}

function validateEnvironment(options = {}) {
  const {
    requirePrivateKey = true,
    requireRpc = true,
    requireWallets = true,
    requireTokenAddress = false,
    requireExplorerKey = false,
    silent = false,
  } = options;

  const errors = [];
  const warnings = [];

  if (requirePrivateKey) {
    addValidationResult(errors, 'PRIVATE_KEY', validatePrivateKey(process.env.PRIVATE_KEY));
  }

  if (requireRpc) {
    addValidationResult(
      errors,
      'BASE_RPC_URL',
      validateRpcUrl(process.env.BASE_RPC_URL, 'BASE_RPC_URL'),
    );
  }

  if (requireWallets) {
    addValidationResult(errors, 'TEAM_WALLET', validateAddress(process.env.TEAM_WALLET, 'TEAM_WALLET'));
    addValidationResult(
      errors,
      'MARKETING_WALLET',
      validateAddress(process.env.MARKETING_WALLET, 'MARKETING_WALLET'),
    );
  }

  if (requireTokenAddress) {
    addValidationResult(
      errors,
      'AETH_TOKEN_ADDRESS',
      validateAddress(process.env.AETH_TOKEN_ADDRESS, 'AETH_TOKEN_ADDRESS'),
    );
  }

  if (requireExplorerKey && !process.env.BASESCAN_API_KEY?.trim()) {
    errors.push({ field: 'BASESCAN_API_KEY', message: 'BASESCAN_API_KEY is not defined' });
  } else if (!process.env.BASESCAN_API_KEY?.trim()) {
    warnings.push({ field: 'BASESCAN_API_KEY', message: 'BASESCAN_API_KEY is not set; verification will be unavailable' });
  }

  if (!silent) {
    printValidationResults(errors, warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function printValidationResults(errors, warnings) {
  if (errors.length === 0 && warnings.length === 0) return;

  console.log('\n' + colors.bold + 'Environment validation' + colors.reset);
  for (const error of errors) {
    console.error(`${colors.red}ERROR ${error.field}: ${error.message}${colors.reset}`);
  }
  for (const warning of warnings) {
    console.warn(`${colors.yellow}WARN ${warning.field}: ${warning.message}${colors.reset}`);
  }
}

async function checkDeploymentBalance(provider, address, minBalanceEther = '0.01') {
  try {
    const balance = await provider.getBalance(address);
    const minimum = ethers.parseEther(minBalanceEther);
    return {
      sufficient: balance >= minimum,
      balance: ethers.formatEther(balance),
      balanceWei: balance.toString(),
    };
  } catch (error) {
    return {
      sufficient: false,
      balance: '0',
      error: `Failed to check balance: ${error.message}`,
    };
  }
}

async function validateBalanceOrExit(provider, address, minBalanceEther = '0.01') {
  const result = await checkDeploymentBalance(provider, address, minBalanceEther);
  if (result.error) {
    throw new Error(result.error);
  }
  if (!result.sufficient) {
    throw new Error(
      `Insufficient Base ETH balance: ${result.balance} ETH; at least ${minBalanceEther} ETH is required`,
    );
  }
  return true;
}

async function validateRpcConnection(rpcUrl, expectedChainId = null) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const blockNumber = await provider.getBlockNumber();

    if (expectedChainId !== null && chainId !== Number(expectedChainId)) {
      return {
        connected: false,
        chainId,
        blockNumber,
        error: `Wrong chain: expected ${expectedChainId}, got ${chainId}`,
      };
    }

    return { connected: true, chainId, blockNumber };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

function validateOrExit(options = {}) {
  const result = validateEnvironment({ ...options, silent: false });
  if (!result.valid) {
    throw new Error('Environment validation failed');
  }
  return result;
}

export {
  validatePrivateKey,
  validateAddress,
  validateRpcUrl,
  validateEnvironment,
  validateOrExit,
  checkDeploymentBalance as checkBalance,
  validateBalanceOrExit,
  validateRpcConnection,
  printValidationResults,
  colors,
};
