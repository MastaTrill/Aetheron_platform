/**
 * Aetheron Platform - Setup Verification Script
 * 
 * This script performs comprehensive pre-deployment checks to ensure your
 * environment is properly configured. Run this before deploying to catch
 * configuration errors early.
 * 
 * Usage: node scripts/verify-setup.js
 */

require('dotenv').config();
const { ethers } = require('ethers');
const {
  validateEnvironment,
  validateRpcConnection,
  checkBalance,
  colors
} = require('../utils/validateEnv');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

/**
 * Add a test result
 */
function addResult(name, passed, message = '', isWarning = false) {
  results.checks.push({
    name,
    passed,
    message,
    isWarning
  });
  
  if (isWarning) {
    results.warnings++;
  } else if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

/**
 * Print a check result
 */
function printCheck(name, passed, message = '', isWarning = false) {
  const status = passed 
    ? `${colors.green}✓ PASS${colors.reset}`
    : isWarning 
      ? `${colors.yellow}⚠ WARN${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`  ${status}  ${name}`);
  
  if (message) {
    const messageColor = passed ? colors.green : isWarning ? colors.yellow : colors.red;
    const lines = message.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`         ${messageColor}${line}${colors.reset}`);
      }
    });
  }
}

/**
 * Main verification function
 */
async function verifySetup() {
  console.log('\n' + colors.bold + colors.cyan + '═'.repeat(70) + colors.reset);
  console.log(colors.bold + colors.cyan + '  🔍 AETHERON PLATFORM - SETUP VERIFICATION' + colors.reset);
  console.log(colors.bold + colors.cyan + '═'.repeat(70) + colors.reset + '\n');

  // =========================================================================
  // STEP 1: Environment File Check
  // =========================================================================
  console.log(colors.bold + '📋 Step 1: Environment File Check' + colors.reset);
  console.log('─'.repeat(70));

  const fs = require('fs');
  const envPath = '.env';
  const envExists = fs.existsSync(envPath);
  
  addResult('Environment file (.env) exists', envExists, 
    envExists ? 'Found .env file' : 'Create .env file by copying .env.example');
  printCheck('Environment file (.env) exists', envExists, 
    envExists ? 'Found .env file' : 'Create .env file by copying .env.example');

  if (!envExists) {
    console.log('\n' + colors.red + '❌ Fatal: .env file not found!' + colors.reset);
    console.log(colors.yellow + '\n💡 To fix:' + colors.reset);
    console.log('   cp .env.example .env');
    console.log('   # Then edit .env with your actual values\n');
    printSummary();
    process.exit(1);
  }

  console.log('');

  // =========================================================================
  // STEP 2: Environment Variables Validation
  // =========================================================================
  console.log(colors.bold + '🔑 Step 2: Environment Variables Validation' + colors.reset);
  console.log('─'.repeat(70));

  const envValidation = validateEnvironment({ 
    requireTokenAddress: false,
    requireWallets: true,
    silent: true 
  });

  // Check each required variable
  const requiredVars = [
    'PRIVATE_KEY',
    'POLYGON_RPC_URL',
    'TEAM_WALLET',
    'MARKETING_WALLET'
  ];

  requiredVars.forEach(varName => {
    const error = envValidation.errors.find(e => e.field === varName);
    const warning = envValidation.warnings.find(w => w.field === varName);
    
    if (error) {
      addResult(varName, false, error.message);
      printCheck(varName, false, error.message);
    } else if (warning) {
      addResult(varName, true, warning.message, true);
      printCheck(varName, true, warning.message, true);
    } else {
      const value = process.env[varName];
      let displayValue = value;
      
      // Mask sensitive values
      if (varName === 'PRIVATE_KEY') {
        displayValue = value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'not set';
      } else if (varName.includes('RPC')) {
        displayValue = value ? value.substring(0, 50) + '...' : 'not set';
      }
      
      addResult(varName, true, `Set to: ${displayValue}`);
      printCheck(varName, true, `Set to: ${displayValue}`);
    }
  });

  console.log('');

  // =========================================================================
  // STEP 3: Network Connectivity Check
  // =========================================================================
  console.log(colors.bold + '🌐 Step 3: Network Connectivity Check' + colors.reset);
  console.log('─'.repeat(70));

  if (process.env.POLYGON_RPC_URL) {
    const rpcCheck = await validateRpcConnection(process.env.POLYGON_RPC_URL);
    
    if (rpcCheck.connected) {
      addResult('Polygon RPC connection', true, 
        `Connected to Chain ID: ${rpcCheck.chainId}\n` +
        `Current block: ${rpcCheck.blockNumber}`);
      printCheck('Polygon RPC connection', true, 
        `Connected to Chain ID: ${rpcCheck.chainId}\n` +
        `Current block: ${rpcCheck.blockNumber}`);

      // Verify chain ID is Polygon mainnet
      if (rpcCheck.chainId === 137) {
        addResult('Network verification (Polygon Mainnet)', true, 
          'Correctly connected to Polygon Mainnet (Chain ID: 137)');
        printCheck('Network verification (Polygon Mainnet)', true, 
          'Correctly connected to Polygon Mainnet (Chain ID: 137)');
      } else {
        addResult('Network verification', false, 
          `Wrong network! Expected Chain ID 137 (Polygon), got ${rpcCheck.chainId}\n` +
          'Update POLYGON_RPC_URL to point to Polygon Mainnet');
        printCheck('Network verification', false, 
          `Wrong network! Expected Chain ID 137 (Polygon), got ${rpcCheck.chainId}\n` +
          'Update POLYGON_RPC_URL to point to Polygon Mainnet');
      }
    } else {
      addResult('Polygon RPC connection', false, 
        `Connection failed: ${rpcCheck.error}`);
      printCheck('Polygon RPC connection', false, 
        `Connection failed: ${rpcCheck.error}`);
    }
  } else {
    addResult('Polygon RPC connection', false, 'POLYGON_RPC_URL not set');
    printCheck('Polygon RPC connection', false, 'POLYGON_RPC_URL not set');
  }

  console.log('');

  // =========================================================================
  // STEP 4: Wallet Balance Check
  // =========================================================================
  console.log(colors.bold + '💰 Step 4: Wallet Balance Check' + colors.reset);
  console.log('─'.repeat(70));

  if (process.env.PRIVATE_KEY && process.env.POLYGON_RPC_URL) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const address = wallet.address;

      console.log(`  Deployer address: ${colors.cyan}${address}${colors.reset}\n`);

      // Check deployer balance
      const balanceCheck = await checkBalance(provider, address, "0.1");
      
      if (balanceCheck.error) {
        addResult('Deployer wallet balance', false, balanceCheck.error);
        printCheck('Deployer wallet balance', false, balanceCheck.error);
      } else {
        const balanceNum = parseFloat(balanceCheck.balance);
        
        if (balanceNum >= 0.5) {
          addResult('Deployer wallet balance', true, 
            `${balanceCheck.balance} POL (Excellent ✓)`);
          printCheck('Deployer wallet balance', true, 
            `${balanceCheck.balance} POL (Excellent ✓)`);
        } else if (balanceNum >= 0.1) {
          addResult('Deployer wallet balance', true, 
            `${balanceCheck.balance} POL (Sufficient for deployment)`, true);
          printCheck('Deployer wallet balance', true, 
            `${balanceCheck.balance} POL (Sufficient for deployment)`, true);
        } else if (balanceNum > 0) {
          addResult('Deployer wallet balance', false, 
            `${balanceCheck.balance} POL (Too low! Need at least 0.1 POL for gas)\n` +
            'Add more POL to your deployer wallet');
          printCheck('Deployer wallet balance', false, 
            `${balanceCheck.balance} POL (Too low! Need at least 0.1 POL for gas)\n` +
            'Add more POL to your deployer wallet');
        } else {
          addResult('Deployer wallet balance', false, 
            '0 POL (Empty wallet!)\n' +
            'Add POL to your deployer wallet before deploying');
          printCheck('Deployer wallet balance', false, 
            '0 POL (Empty wallet!)\n' +
            'Add POL to your deployer wallet before deploying');
        }
      }

      // Check if AETH_TOKEN_ADDRESS is set and check token balance
      if (process.env.AETH_TOKEN_ADDRESS) {
        try {
          const tokenAddress = process.env.AETH_TOKEN_ADDRESS;
          const tokenAbi = [
            "function balanceOf(address) view returns (uint256)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)"
          ];
          const token = new ethers.Contract(tokenAddress, tokenAbi, provider);
          
          const tokenBalance = await token.balanceOf(address);
          const symbol = await token.symbol();
          const decimals = await token.decimals();
          const formattedBalance = ethers.formatUnits(tokenBalance, decimals);
          
          addResult('AETH Token balance', true, 
            `${formattedBalance} ${symbol}`);
          printCheck('AETH Token balance', true, 
            `${formattedBalance} ${symbol}`);
        } catch (error) {
          addResult('AETH Token balance', false, 
            `Could not read token: ${error.message}`, true);
          printCheck('AETH Token balance', false, 
            `Could not read token: ${error.message}`, true);
        }
      }

    } catch (error) {
      addResult('Wallet initialization', false, 
        `Failed to initialize wallet: ${error.message}`);
      printCheck('Wallet initialization', false, 
        `Failed to initialize wallet: ${error.message}`);
    }
  } else {
    addResult('Wallet balance check', false, 
      'Cannot check balance (missing PRIVATE_KEY or POLYGON_RPC_URL)');
    printCheck('Wallet balance check', false, 
      'Cannot check balance (missing PRIVATE_KEY or POLYGON_RPC_URL)');
  }

  console.log('');

  // =========================================================================
  // STEP 5: Optional Configuration Check
  // =========================================================================
  console.log(colors.bold + '⚙️  Step 5: Optional Configuration' + colors.reset);
  console.log('─'.repeat(70));

  const optionalVars = [
    { name: 'AETH_TOKEN_ADDRESS', description: 'Token contract address (needed for post-deployment scripts)' },
    { name: 'STAKING_CONTRACT_ADDRESS', description: 'Staking contract address' },
    { name: 'POLYGONSCAN_API_KEY', description: 'For contract verification' }
  ];

  optionalVars.forEach(({ name, description }) => {
    const value = process.env[name];
    if (value && value.trim() !== '') {
      let displayValue = value;
      if (name.includes('API_KEY')) {
        displayValue = `${value.substring(0, 8)}...`;
      }
      addResult(name, true, `Set to: ${displayValue}`);
      printCheck(name, true, `Set to: ${displayValue}`);
    } else {
      addResult(name, true, `Not set (${description})`, true);
      printCheck(name, true, `Not set (${description})`, true);
    }
  });

  console.log('');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  printSummary();
}

/**
 * Print final summary
 */
function printSummary() {
  console.log(colors.bold + '═'.repeat(70) + colors.reset);
  console.log(colors.bold + '📊 VERIFICATION SUMMARY' + colors.reset);
  console.log(colors.bold + '═'.repeat(70) + colors.reset + '\n');

  console.log(`  ${colors.green}✓ Passed:  ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed:  ${results.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠ Warnings: ${results.warnings}${colors.reset}`);
  console.log(`  Total checks: ${results.passed + results.failed + results.warnings}\n`);

  if (results.failed === 0) {
    console.log(colors.green + colors.bold + '🎉 ALL CRITICAL CHECKS PASSED!' + colors.reset);
    console.log(colors.green + '   Your environment is properly configured for deployment.' + colors.reset + '\n');
    
    if (results.warnings > 0) {
      console.log(colors.yellow + '⚠️  Note: There are warnings, but you can proceed.' + colors.reset);
      console.log(colors.yellow + '   Review the warnings above and address if necessary.' + colors.reset + '\n');
    }

    console.log(colors.cyan + '📖 Next Steps:' + colors.reset);
    console.log('   1. Deploy contracts:');
    console.log('      npx hardhat run scripts/deploy.js --network polygon');
    console.log('   2. Update AETH_TOKEN_ADDRESS in .env after deployment');
    console.log('   3. Enable trading:');
    console.log('      node scripts/enable-trading.js');
    console.log('   4. Add liquidity:');
    console.log('      node scripts/add-liquidity.js\n');
  } else {
    console.log(colors.red + colors.bold + '❌ VERIFICATION FAILED!' + colors.reset);
    console.log(colors.red + '   Fix the errors above before deploying.' + colors.reset + '\n');

    console.log(colors.cyan + '📖 How to fix:' + colors.reset);
    console.log('   1. Review the failed checks above');
    console.log('   2. Update your .env file with correct values');
    console.log('   3. Compare with .env.example for required format');
    console.log('   4. Run this script again: node scripts/verify-setup.js\n');
  }

  console.log(colors.bold + '═'.repeat(70) + colors.reset + '\n');
}

// Run verification
verifySetup()
  .then(() => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n' + colors.red + '❌ Verification script error:' + colors.reset);
    console.error(error);
    process.exit(1);
  });
