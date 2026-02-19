// show-deployer-address.js
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});
const { Wallet } = require('ethers');

if (!process.env.PRIVATE_KEY) {
  console.error('PRIVATE_KEY not set in .env');
  process.exit(1);
}

const wallet = new Wallet(process.env.PRIVATE_KEY);
console.log('Deployer wallet address:', wallet.address);
