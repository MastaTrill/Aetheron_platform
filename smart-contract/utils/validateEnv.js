/**
 * Environment Variable Validation Utilities
 * 
 * This module provides centralized validation for all environment variables
 * used in deployment and interaction scripts. It helps catch configuration
 * errors before they cause deployment failures.
 */

const { ethers } = require("ethers");

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Validates that a private key is properly formatted
 * @param {string} privateKey - The private key to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validatePrivateKey(privateKey) {
  if (!privateKey) {
    return {
      valid: false,
      error: 'PRIVATE_KEY is not defined in .env file'
    };
  }

  // Remove 0x prefix for validation
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  if (!privateKey.startsWith('0x')) {
    return {
      valid: false,
      error: 'PRIVATE_KEY must start with 0x prefix\n' +
             `  Current: ${privateKey.substring(0, 10)}...\n` +
             `  Expected: 0x${privateKey.substring(0, 10)}...`
    };
  }

  if (cleanKey.length !== 64) {
    return {
      valid: false,
      error: `PRIVATE_KEY must be 64 hexadecimal characters (66 total with 0x)\n` +
             `  Current length: ${privateKey.length} (should be 66)`
    };
  }

  if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
    return {
      valid: false,
      error: 'PRIVATE_KEY must contain only hexadecimal characters (0-9, a-f, A-F)'
    };
  }

  // Check if it's a placeholder/dummy key
  const allZeros = /^0x0+$/.test(privateKey);
  const allOnes = /^0x1+$/.test(privateKey);
  const sequential = privateKey === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  
  if (allZeros || allOnes || sequential) {
    return {
      valid: false,
      error: 'PRIVATE_KEY appears to be a placeholder/example value\n' +
             '  Please set your actual wallet private key in .env'
    };
  }

  return { valid: true };
}

/**
 * Validates that an Ethereum address is properly formatted
 * @param {string} address - The address to validate
 * @param {string} varName - The name of the environment variable (for error messages)
 * @returns {Object} { valid: boolean, error: string }
 */
function validateAddress(address, varName) {
  if (!address) {
    return {
      valid: false,
      error: `${varName} is not defined in .env file`
    };
  }

  // Trim whitespace
  const trimmedAddress = address.trim();
  
  if (trimmedAddress !== address) {
    return {
      valid: false,
      error: `${varName} contains extra whitespace\n` +
             `  Remove spaces at beginning or end of address`
    };
  }

  if (!trimmedAddress.startsWith('0x')) {
    return {
      valid: false,
      error: `${varName} must start with 0x prefix\n` +
             `  Current: ${trimmedAddress}\n` +
             `  Expected: 0x${trimmedAddress}`
    };
  }

  if (trimmedAddress.length !== 42) {
    return {
      valid: false,
      error: `${varName} must be 42 characters (0x + 40 hex characters)\n` +
             `  Current length: ${trimmedAddress.length}`
    };
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmedAddress)) {
    return {
      valid: false,
      error: `${varName} must contain only hexadecimal characters\n` +
             `  Format: 0x followed by 40 hex characters (0-9, a-f, A-F)`
    };
  }

  // Check for zero address
  if (trimmedAddress === '0x0000000000000000000000000000000000000000') {
    return {
      valid: false,
      error: `${varName} is set to zero address (0x0...0)\n` +
             `  Please provide a valid wallet address`
    };
  }

  // Validate checksum if address has mixed case (EIP-55)
  try {
    const checksumAddress = ethers.getAddress(trimmedAddress);
    if (trimmedAddress !== checksumAddress && trimmedAddress !== checksumAddress.toLowerCase()) {
      return {
        valid: true,
        warning: `${varName} checksum is invalid but address format is correct\n` +
                `  Current:  ${trimmedAddress}\n` +
                `  Expected: ${checksumAddress}`
      };
    }
  } catch (e) {
    // If ethers can't validate, still allow it if format is correct
  }

  return { valid: true };
}

/**
 * Validates that an RPC URL is properly formatted
 * @param {string} url - The RPC URL to validate
 * @param {string} varName - The name of the environment variable (for error messages)
 * @returns {Object} { valid: boolean, error: string }
 */
function validateRpcUrl(url, varName) {
  if (!url) {
    return {
      valid: false,
      error: `${varName} is not defined in .env file`
    };
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl !== url) {
    return {
      valid: false,
      error: `${varName} contains extra whitespace\n` +
             `  Remove spaces at beginning or end of URL`
    };
  }

  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return {
      valid: false,
      error: `${varName} must start with http:// or https://\n` +
             `  Current: ${trimmedUrl.substring(0, 30)}...`
    };
  }

  // Basic URL validation
  try {
    new URL(trimmedUrl);
  } catch (e) {
    return {
      valid: false,
      error: `${varName} is not a valid URL\n` +
             `  Error: ${e.message}`
    };
  }

  return { valid: true };
}

/**
 * Validates required environment variables for deployment scripts
 * @param {Object} options - Validation options
 * @param {boolean} options.requireTokenAddress - Whether AETH_TOKEN_ADDRESS is required
 * @param {boolean} options.requireWallets - Whether wallet addresses are required
 * @param {boolean} options.silent - Whether to suppress console output
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
function validateEnvironment(options = {}) {
  const {
    requireTokenAddress = false,
    requireWallets = true,
    silent = false
  } = options;

  const errors = [];
  const warnings = [];

  // Validate PRIVATE_KEY
  const pkResult = validatePrivateKey(process.env.PRIVATE_KEY);
  if (!pkResult.valid) {
    errors.push({
      field: 'PRIVATE_KEY',
      message: pkResult.error
    });
  }

  // Validate POLYGON_RPC_URL
  const rpcResult = validateRpcUrl(process.env.POLYGON_RPC_URL, 'POLYGON_RPC_URL');
  if (!rpcResult.valid) {
    errors.push({
      field: 'POLYGON_RPC_URL',
      message: rpcResult.error
    });
  }

  // Validate wallet addresses if required
  if (requireWallets) {
    const teamResult = validateAddress(process.env.TEAM_WALLET, 'TEAM_WALLET');
    if (!teamResult.valid) {
      errors.push({
        field: 'TEAM_WALLET',
        message: teamResult.error
      });
    } else if (teamResult.warning) {
      warnings.push({
        field: 'TEAM_WALLET',
        message: teamResult.warning
      });
    }

    const marketingResult = validateAddress(process.env.MARKETING_WALLET, 'MARKETING_WALLET');
    if (!marketingResult.valid) {
      errors.push({
        field: 'MARKETING_WALLET',
        message: marketingResult.error
      });
    } else if (marketingResult.warning) {
      warnings.push({
        field: 'MARKETING_WALLET',
        message: marketingResult.warning
      });
    }
  }

  // Validate AETH_TOKEN_ADDRESS if required
  if (requireTokenAddress) {
    const tokenResult = validateAddress(process.env.AETH_TOKEN_ADDRESS, 'AETH_TOKEN_ADDRESS');
    if (!tokenResult.valid) {
      errors.push({
        field: 'AETH_TOKEN_ADDRESS',
        message: tokenResult.error
      });
    } else if (tokenResult.warning) {
      warnings.push({
        field: 'AETH_TOKEN_ADDRESS',
        message: tokenResult.warning
      });
    }
  }

  if (!silent) {
    printValidationResults(errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Prints validation results to console
 * @param {Array} errors - Array of error objects
 * @param {Array} warnings - Array of warning objects
 */
function printValidationResults(errors, warnings) {
  if (errors.length === 0 && warnings.length === 0) {
    return;
  }

  console.log('\n' + colors.bold + '🔍 Environment Variable Validation' + colors.reset);
  console.log('='.repeat(60) + '\n');

  if (errors.length > 0) {
    console.log(colors.red + colors.bold + '❌ ERRORS:' + colors.reset);
    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${colors.red}${error.field}${colors.reset}`);
      console.log(`   ${error.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(colors.yellow + colors.bold + '⚠️  WARNINGS:' + colors.reset);
    warnings.forEach((warning, index) => {
      console.log(`\n${index + 1}. ${colors.yellow}${warning.field}${colors.reset}`);
      console.log(`   ${warning.message}\n`);
    });
  }

  if (errors.length > 0) {
    console.log(colors.red + '═'.repeat(60) + colors.reset);
    console.log(colors.red + '❌ Configuration validation failed!' + colors.reset);
    console.log(colors.red + '═'.repeat(60) + colors.reset + '\n');
    
    console.log(colors.cyan + '📖 How to fix:' + colors.reset);
    console.log('   1. Check your .env file in the smart-contract directory');
    console.log('   2. Compare with .env.example for required format');
    console.log('   3. Fix the errors listed above');
    console.log('   4. Run this script again to verify\n');
  }
}

/**
 * Checks if the deployer wallet has sufficient balance
 * @param {Object} provider - Ethers provider instance
 * @param {string} address - Wallet address to check
 * @param {string} minBalance - Minimum balance required in POL/ETH (default: "0.1")
 * @returns {Promise<Object>} { sufficient: boolean, balance: string, error: string }
 */
async function checkBalance(provider, address, minBalance = "0.1") {
  try {
    const balance = await provider.getBalance(address);
    const balanceInEther = ethers.formatEther(balance);
    const minBalanceInWei = ethers.parseEther(minBalance);
    
    return {
      sufficient: balance >= minBalanceInWei,
      balance: balanceInEther,
      balanceWei: balance.toString()
    };
  } catch (error) {
    return {
      sufficient: false,
      balance: '0',
      error: `Failed to check balance: ${error.message}`
    };
  }
}

/**
 * Validates RPC connectivity
 * @param {string} rpcUrl - RPC URL to test
 * @returns {Promise<Object>} { connected: boolean, chainId: number, error: string }
 */
async function validateRpcConnection(rpcUrl) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    return {
      connected: true,
      chainId: Number(network.chainId),
      blockNumber: blockNumber
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Validates environment and exits process if errors found
 * @param {Object} options - Validation options (same as validateEnvironment)
 */
function validateOrExit(options = {}) {
  const result = validateEnvironment({ ...options, silent: false });
  
  if (!result.valid) {
    console.error(colors.red + '\n❌ Exiting due to configuration errors.\n' + colors.reset);
    process.exit(1);
  }
  
  if (result.warnings.length > 0) {
    console.log(colors.yellow + '⚠️  Warnings detected, but continuing...\n' + colors.reset);
  }
}

module.exports = {
  validatePrivateKey,
  validateAddress,
  validateRpcUrl,
  validateEnvironment,
  validateOrExit,
  checkBalance,
  validateRpcConnection,
  printValidationResults,
  colors
};
