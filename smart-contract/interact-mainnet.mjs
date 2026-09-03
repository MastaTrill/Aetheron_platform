import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const BASE_CHAIN_ID = 8453;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

function requireAddress(value, name) {
  if (!value || !ethers.isAddress(value) || value.toLowerCase() === ethers.ZeroAddress.toLowerCase()) {
    throw new Error(`${name} must be a valid non-zero EVM address`);
  }
  return value;
}

async function main() {
  if (process.env.CONFIRM_MAINNET_INTERACTION !== 'CONFIRM_MAINNET_INTERACTION') {
    throw new Error('Refusing mainnet write. Set CONFIRM_MAINNET_INTERACTION=CONFIRM_MAINNET_INTERACTION for an intentional Base transaction.');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY || '')) {
    throw new Error('PRIVATE_KEY must be a valid 0x-prefixed 32-byte key');
  }

  const action = String(process.env.MAINNET_ACTION || '').toLowerCase();
  if (!['transfer', 'stake', 'claim'].includes(action)) {
    throw new Error('MAINNET_ACTION must be transfer, stake, or claim');
  }

  const tokenAddress = requireAddress(process.env.AETH_TOKEN_ADDRESS, 'AETH_TOKEN_ADDRESS');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    throw new Error(`Wrong network: expected Base Mainnet ${BASE_CHAIN_ID}, got ${network.chainId}`);
  }

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const token = new ethers.Contract(
    tokenAddress,
    [
      'function transfer(address to,uint256 amount) returns (bool)',
      'function approve(address spender,uint256 amount) returns (bool)',
      'function decimals() view returns (uint8)',
    ],
    signer,
  );

  let tx;
  if (action === 'transfer') {
    const recipient = requireAddress(process.env.RECIPIENT_ADDRESS, 'RECIPIENT_ADDRESS');
    const decimals = await token.decimals();
    const amount = ethers.parseUnits(process.env.MAINNET_TOKEN_AMOUNT || '0', decimals);
    if (amount <= 0n) throw new Error('MAINNET_TOKEN_AMOUNT must be greater than zero');
    tx = await token.transfer(recipient, amount);
  } else {
    const stakingAddress = requireAddress(process.env.STAKING_CONTRACT_ADDRESS, 'STAKING_CONTRACT_ADDRESS');
    const staking = new ethers.Contract(
      stakingAddress,
      ['function stake(uint256 amount)', 'function claim()'],
      signer,
    );

    if (action === 'stake') {
      const decimals = await token.decimals();
      const amount = ethers.parseUnits(process.env.MAINNET_TOKEN_AMOUNT || '0', decimals);
      if (amount <= 0n) throw new Error('MAINNET_TOKEN_AMOUNT must be greater than zero');
      const approveTx = await token.approve(stakingAddress, amount);
      console.log(`Approval submitted: https://basescan.org/tx/${approveTx.hash}`);
      await approveTx.wait();
      tx = await staking.stake(amount);
    } else {
      tx = await staking.claim();
    }
  }

  console.log(`Transaction submitted: https://basescan.org/tx/${tx.hash}`);
  await tx.wait();
  console.log(`${action} confirmed on Base Mainnet.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
