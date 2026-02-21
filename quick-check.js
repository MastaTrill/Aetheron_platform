// Quick balance checker
const ethers = require('ethers');

const privateKey =
  '48935deec3b96fc16d5d0a25de885d4ad9b4dfbf38bd78ef018f50dee8818485';
const wallet = new ethers.Wallet(privateKey);

console.log('Wallet Address:', wallet.address);
console.log('Check balances at:');
console.log('https://polygonscan.com/address/' + wallet.address);
console.log(
  'https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e?a=' +
    wallet.address,
);
