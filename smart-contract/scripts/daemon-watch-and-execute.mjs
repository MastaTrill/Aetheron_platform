import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const OWNER_ADDRESS = '0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2';
const PRESALE_ADDRESS = '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const AETH_TOKEN_ADDRESS = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const BASE_L1_BRIDGE = '0x3154Cf16ccdb4C6d922629664174b904d80F2C35';

const PRESALE_ABI = [
  'function owner() view returns (address)',
  'function refundsAvailable() view returns (bool)',
  'function tokensReserved() view returns (uint256)',
  'function withdrawUnsoldTokens() external'
];

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)'
];

const BRIDGE_ABI = [
  'function depositETH(uint32 _minGasLimit, bytes _extraData) external payable'
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const baseRpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const ethRpc = process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com';

  const baseProvider = new ethers.JsonRpcProvider(baseRpc, 8453, { staticNetwork: true, batchMaxCount: 1 });
  const ethProvider = new ethers.JsonRpcProvider(ethRpc, 1, { staticNetwork: true, batchMaxCount: 1 });

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required in .env');

  const baseSigner = new ethers.Wallet(privateKey, baseProvider);
  const ethSigner = new ethers.Wallet(privateKey, ethProvider);

  console.log('=== Active Monitor Started: Waiting for ETH Arrival ===');
  console.log('Target Wallet: ' + OWNER_ADDRESS);
  console.log('Monitoring both Base (L2) and Ethereum (L1)...\n');

  const maxAttempts = 360; // 360 attempts * 10 seconds = 60 minutes
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [baseBal, ethBal] = await Promise.all([
        baseProvider.getBalance(OWNER_ADDRESS),
        ethProvider.getBalance(OWNER_ADDRESS)
      ]);

      if (baseBal >= 1000000000000n) { // >= 0.000001 ETH
        console.log(`[ATTEMPT ${attempt}] Gas confirmed on Base! Balance: ${ethers.formatEther(baseBal)} ETH`);
        console.log('Broadcasting withdrawUnsoldTokens() on Base...');

        const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, baseSigner);
        const token = new ethers.Contract(AETH_TOKEN_ADDRESS, TOKEN_ABI, baseProvider);

        const [bal, reserved] = await Promise.all([
          token.balanceOf(PRESALE_ADDRESS),
          presale.tokensReserved()
        ]);
        const unsold = bal - reserved;
        console.log('Claiming ' + ethers.formatUnits(unsold, 18) + ' AETH from presale...');

        const tx = await presale.withdrawUnsoldTokens();
        console.log('TX Broadcast: ' + tx.hash);
        const receipt = await tx.wait();
        console.log('CONFIRMED! Base Block: ' + receipt.blockNumber);
        console.log('BaseScan: https://basescan.org/tx/' + tx.hash);

        const finalBal = await token.balanceOf(OWNER_ADDRESS);
        console.log('Final Owner AETH: ' + ethers.formatUnits(finalBal, 18) + ' AETH');
        console.log('ALL OPERATIONS COMPLETED SUCCESSFULLY.');
        return;
      }

      if (ethBal > 2000000000000000n) { // > 0.002 ETH on L1
        console.log(`[ATTEMPT ${attempt}] ETH detected on Ethereum L1! Balance: ${ethers.formatEther(ethBal)} ETH`);
        console.log('Bridging gas to Base L2 via Base L1StandardBridge...');

        const bridge = new ethers.Contract(BASE_L1_BRIDGE, BRIDGE_ABI, ethSigner);
        const bridgeAmount = ethBal > 10000000000000000n ? ethers.parseEther('0.005') : (ethBal / 2n);
        const tx = await bridge.depositETH(200000, '0x', { value: bridgeAmount });
        console.log('Bridge TX: ' + tx.hash);
        await tx.wait();
        console.log('Bridge deposit confirmed on L1. Waiting 90s for Base L2 arrival...');
        await sleep(90000);
        continue;
      }

      if (attempt % 6 === 0) {
        console.log(`[ATTEMPT ${attempt}/${maxAttempts}] Still in transit... (Base: 0 ETH, Eth: 0 ETH)`);
      }
    } catch (err) {
      console.warn(`[ATTEMPT ${attempt}] Check warning: ` + (err.shortMessage || err.message || err));
    }

    await sleep(10000);
  }

  console.log('Monitoring window ended (10 minutes elapsed). Re-check if transaction is still pending on exchange.');
}

main().catch(err => {
  console.error('Fatal monitor error:', err);
  process.exit(1);
});
