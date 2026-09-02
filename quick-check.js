import { Wallet } from 'ethers';

const privateKey = process.env.QUICK_CHECK_PRIVATE_KEY;
if (!privateKey) {
  console.error('Set QUICK_CHECK_PRIVATE_KEY to inspect a wallet. No private key is stored in this repository.');
  process.exit(2);
}

let wallet;
try {
  wallet = new Wallet(privateKey);
} catch {
  console.error('QUICK_CHECK_PRIVATE_KEY is not a valid EVM private key.');
  process.exit(2);
}

console.log('Wallet Address:', wallet.address);
console.log('Check Base balances at:');
console.log(`https://basescan.org/address/${wallet.address}`);
console.log(`https://basescan.org/token/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e?a=${wallet.address}`);
