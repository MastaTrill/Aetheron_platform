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
  'function depositETH(uint32 _minGasLimit, bytes _extraData) external payable',
  'function depositETHTo(address _to, uint32 _minGasLimit, bytes _extraData) external payable'
];

async function main() {
  const baseRpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const ethRpc = process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com';

  const baseProvider = new ethers.JsonRpcProvider(baseRpc, 8453, { staticNetwork: true, batchMaxCount: 1 });
  const ethProvider = new ethers.JsonRpcProvider(ethRpc, 1, { staticNetwork: true, batchMaxCount: 1 });

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required');

  const baseSigner = new ethers.Wallet(privateKey, baseProvider);
  const ethSigner = new ethers.Wallet(privateKey, ethProvider);

  console.log('=== Checking Balances for Autonomous Execution ===');
  console.log('Owner Wallet: ' + OWNER_ADDRESS);

  const [baseBal, ethBal] = await Promise.all([
    baseProvider.getBalance(OWNER_ADDRESS),
    ethProvider.getBalance(OWNER_ADDRESS)
  ]);

  console.log('Base L2 ETH:     ' + ethers.formatEther(baseBal) + ' ETH');
  console.log('Ethereum L1 ETH: ' + ethers.formatEther(ethBal) + ' ETH');

  // Case 1: Gas already on Base L2
  if (baseBal >= 1000000000000n) { // >= 0.000001 ETH
    console.log('\n[STEP] Sufficient gas on Base! Executing withdrawUnsoldTokens()...');
    const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, baseSigner);
    const token = new ethers.Contract(AETH_TOKEN_ADDRESS, TOKEN_ABI, baseProvider);

    const [bal, reserved] = await Promise.all([
      token.balanceOf(PRESALE_ADDRESS),
      presale.tokensReserved()
    ]);
    const unsold = bal - reserved;
    console.log('Withdrawing ' + ethers.formatUnits(unsold, 18) + ' AETH...');

    const tx = await presale.withdrawUnsoldTokens();
    console.log('TX Broadcast on Base: ' + tx.hash);
    const receipt = await tx.wait();
    console.log('SUCCESS! Confirmed in Base Block ' + receipt.blockNumber);
    console.log('BaseScan: https://basescan.org/tx/' + tx.hash);

    const finalAeth = await token.balanceOf(OWNER_ADDRESS);
    console.log('Final Owner AETH Balance: ' + ethers.formatUnits(finalAeth, 18) + ' AETH');
    return { status: 'COMPLETE', txHash: tx.hash };
  }

  // Case 2: ETH is on Ethereum L1, need to bridge to Base
  if (ethBal > 2000000000000000n) { // > 0.002 ETH
    console.log('\n[STEP] ETH detected on Ethereum L1! Initiating bridge to Base...');
    const bridge = new ethers.Contract(BASE_L1_BRIDGE, BRIDGE_ABI, ethSigner);
    const bridgeAmount = ethBal > 10000000000000000n ? ethers.parseEther('0.005') : (ethBal / 2n);
    console.log('Bridging ' + ethers.formatEther(bridgeAmount) + ' ETH to Base via Base L1StandardBridge...');

    const bridgeTx = await bridge.depositETH(200000, '0x', { value: bridgeAmount });
    console.log('Bridge TX Broadcast on Ethereum L1: ' + bridgeTx.hash);
    const receipt = await bridgeTx.wait();
    console.log('Bridge Confirmed on L1 in block ' + receipt.blockNumber);
    console.log('Etherscan: https://etherscan.io/tx/' + bridgeTx.hash);
    console.log('Waiting for Base L2 arrival (typically 1-3 minutes)...');
    return { status: 'BRIDGING', txHash: bridgeTx.hash };
  }

  console.log('\n[PENDING] Waiting for deposit to land on either Base or Ethereum L1...');
  return { status: 'WAITING' };
}

main().then(res => {
  if (res && res.status === 'COMPLETE') process.exit(0);
  if (res && res.status === 'BRIDGING') process.exit(2);
  process.exit(1);
}).catch(err => {
  console.error('Error:', err.message || err);
  process.exit(3);
});
