import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  callViewWithRetry,
  readWithRetry
} from './lib/base-read-retry.mjs';

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const PRESALE_ADDRESS = '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const AETH_TOKEN_ADDRESS = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const OWNER_ADDRESS = '0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2';

const PRESALE_ABI = [
  'function owner() view returns (address)',
  'function refundsAvailable() view returns (bool)',
  'function tokensReserved() view returns (uint256)',
  'function withdrawUnsoldTokens() external'
];

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)'
];

async function main() {
  const baseRpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const ethRpc = 'https://ethereum-rpc.publicnode.com';

  const baseProvider = new ethers.JsonRpcProvider(baseRpc, Number(EXPECTED_CHAIN_ID), {
    staticNetwork: true,
    batchMaxCount: 1
  });
  const ethProvider = new ethers.JsonRpcProvider(ethRpc);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required in .env');

  const signer = new ethers.Wallet(privateKey, baseProvider);
  if (signer.address.toLowerCase() !== OWNER_ADDRESS.toLowerCase()) {
    throw new Error('Signer is not owner ' + OWNER_ADDRESS);
  }

  console.log('=== Watching for Incoming ETH to Execute Launch ===');
  console.log('Target Wallet:   ' + OWNER_ADDRESS);
  console.log('Presale Address: ' + PRESALE_ADDRESS);

  const baseBal = await baseProvider.getBalance(OWNER_ADDRESS);
  const ethBal = await ethProvider.getBalance(OWNER_ADDRESS);

  console.log('Current Base ETH:     ' + ethers.formatEther(baseBal) + ' ETH');
  console.log('Current Ethereum ETH: ' + ethers.formatEther(ethBal) + ' ETH');

  if (baseBal > 1000000000000n) { // > 0.000001 ETH (enough for gas!)
    console.log('\n[SUCCESS] Base gas detected! Broadcasting withdrawUnsoldTokens()...');
    const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
    const token = new ethers.Contract(AETH_TOKEN_ADDRESS, TOKEN_ABI, baseProvider);

    const [bal, reserved] = await Promise.all([
      token.balanceOf(PRESALE_ADDRESS),
      presale.tokensReserved()
    ]);
    const unsold = bal - reserved;
    console.log('Recovering ' + ethers.formatUnits(unsold, 18) + ' AETH...');

    const tx = await presale.withdrawUnsoldTokens();
    console.log('Transaction Broadcast: ' + tx.hash);
    console.log('Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('CONFIRMED in Block: ' + receipt.blockNumber);
    console.log('BaseScan URL: https://basescan.org/tx/' + tx.hash);

    const finalBal = await token.balanceOf(OWNER_ADDRESS);
    console.log('New Owner AETH Balance: ' + ethers.formatUnits(finalBal, 18) + ' AETH');
    return true;
  } else {
    console.log('\n[WAITING] Base ETH balance is still ' + ethers.formatEther(baseBal) + ' ETH.');
    if (ethBal > 0n) {
      console.log('[NOTE] You have ' + ethers.formatEther(ethBal) + ' ETH on Ethereum Mainnet (L1). It needs to be bridged to Base.');
    }
    return false;
  }
}

main().catch((err) => {
  console.error('Execution note:', err.message || err);
});
