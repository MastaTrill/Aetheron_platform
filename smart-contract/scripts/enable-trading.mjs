import hre from 'hardhat';
import dotenv from 'dotenv';
import { ethers as standaloneEthers } from 'ethers';

dotenv.config();

const BASE_CHAIN_ID = 8453;

async function main() {
  const connection = await hre.network.connect();
  const { ethers } = connection;
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== BASE_CHAIN_ID) {
    throw new Error(`Refusing trading change: expected Base Mainnet ${BASE_CHAIN_ID}, got ${chainId}`);
  }

  const tokenAddress = process.env.AETH_TOKEN_ADDRESS;
  if (!tokenAddress || !standaloneEthers.isAddress(tokenAddress)) {
    throw new Error('AETH_TOKEN_ADDRESS must be a valid Base contract address');
  }

  const Aetheron = await ethers.getContractFactory('contracts/Aetheron.sol:Aetheron');
  const aetheron = Aetheron.attach(tokenAddress);
  const tradingEnabled = await aetheron.tradingEnabled();
  console.log(`Trading currently ${tradingEnabled ? 'ENABLED' : 'DISABLED'} on Base Mainnet.`);

  if (tradingEnabled) {
    return;
  }

  if (
    process.env.CONFIRM_ENABLE_TRADING !== 'CONFIRM_ENABLE_TRADING' ||
    process.env.LIVE_ACTION !== 'true' ||
    process.env.CONFIRM_LIVE_ACTION !== 'ENABLE_TRADING_ON_BASE'
  ) {
    throw new Error(
      'Refusing to enable trading. Require CONFIRM_ENABLE_TRADING=CONFIRM_ENABLE_TRADING, LIVE_ACTION=true, and CONFIRM_LIVE_ACTION=ENABLE_TRADING_ON_BASE.',
    );
  }

  const [signer] = await ethers.getSigners();
  if (!signer) throw new Error('No signer available');
  console.log(`Owner action signer: ${signer.address}`);

  const tx = await aetheron.enableTrading();
  console.log(`Submitted: https://basescan.org/tx/${tx.hash}`);
  await tx.wait();

  const newStatus = await aetheron.tradingEnabled();
  if (!newStatus) {
    throw new Error('Transaction confirmed but tradingEnabled() is still false');
  }

  console.log('Trading enabled on Base Mainnet.');
}

main().catch((error) => {
  console.error(error.message);
  if (process.env.AETH_TOKEN_ADDRESS) {
    console.error(`Contract: https://basescan.org/address/${process.env.AETH_TOKEN_ADDRESS}`);
  }
  process.exit(1);
});
