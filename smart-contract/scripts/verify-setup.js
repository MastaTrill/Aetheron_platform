// verify-setup.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('ethers');

function checkEnvVar(name) {
  if (!process.env[name] || process.env[name].includes('YOUR_')) {
    throw new Error(`Missing or placeholder value for ${name}`);
  }
}

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isValidPrivateKey(key) {
  return /^0x[a-fA-F0-9]{64}$/.test(key);
}

(async () => {
  try {
    // 1. .env presence
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) throw new Error('.env file not found');
    console.log('✓ .env file found');

    // 2. Required variables
    const required = [
      'PRIVATE_KEY',
      'POLYGON_RPC_URL',
      'TEAM_WALLET',
      'MARKETING_WALLET',
    ];
    required.forEach(checkEnvVar);
    console.log('✓ Required environment variables present');

    // 3. Private key format
    if (!isValidPrivateKey(process.env.PRIVATE_KEY))
      throw new Error('Invalid PRIVATE_KEY format');
    console.log('✓ PRIVATE_KEY format valid');

    // 4. Address format
    if (!isValidAddress(process.env.TEAM_WALLET))
      throw new Error('Invalid TEAM_WALLET address');
    if (!isValidAddress(process.env.MARKETING_WALLET))
      throw new Error('Invalid MARKETING_WALLET address');
    console.log('✓ Wallet address formats valid');

    // 5. Polygon RPC connectivity
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const net = await provider.getNetwork();
    if (!net || !net.chainId)
      throw new Error('Could not connect to Polygon RPC');
    console.log(`✓ Polygon RPC connectivity: chainId ${net.chainId}`);

    // 6. Deployer wallet balance

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const bal = await provider.getBalance(wallet.address);
    console.log(`✓ Deployer wallet balance: ${ethers.formatEther(bal)} MATIC`);
    if (bal < ethers.parseEther('0.1'))
      throw new Error('Deployer wallet balance is low (<0.1 MATIC)');

    console.log('\n🎉 All checks passed! Ready for deployment.');
    process.exit(0);
  } catch (e) {
    console.error('✗', e.message);
    process.exit(1);
  }
})();
