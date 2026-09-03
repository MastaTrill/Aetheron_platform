import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { colors } from './utils/validateEnv.mjs';

dotenv.config();

const BASE_CHAIN_ID = 8453;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

function requireAddress(value, name) {
  if (!value || !ethers.isAddress(value) || value.toLowerCase() === ethers.ZeroAddress.toLowerCase()) {
    throw new Error(`${name} must be a valid non-zero EVM address`);
  }
  return value;
}

function parseNonNegative(value, name) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return parsed;
}

async function main() {
  if (process.env.CONFIRM_WALLET_FUNDING !== 'CONFIRM_WALLET_FUNDING') {
    throw new Error('Refusing wallet funding. Set CONFIRM_WALLET_FUNDING=CONFIRM_WALLET_FUNDING for an intentional Base write.');
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY || '')) {
    throw new Error('PRIVATE_KEY must be a valid 0x-prefixed 32-byte key');
  }

  const teamWallet = requireAddress(process.env.TEAM_WALLET, 'TEAM_WALLET');
  const marketingWallet = requireAddress(process.env.MARKETING_WALLET, 'MARKETING_WALLET');
  const ethAmount = parseNonNegative(process.env.BASE_ETH_AMOUNT_PER_WALLET, 'BASE_ETH_AMOUNT_PER_WALLET');
  const aethAmount = parseNonNegative(process.env.AETH_AMOUNT_PER_WALLET, 'AETH_AMOUNT_PER_WALLET');

  if (ethAmount === 0 && aethAmount === 0) {
    throw new Error('Nothing to fund. Set BASE_ETH_AMOUNT_PER_WALLET and/or AETH_AMOUNT_PER_WALLET above zero.');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    throw new Error(`Wrong network: expected Base Mainnet ${BASE_CHAIN_ID}, got ${network.chainId}`);
  }

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const recipients = [teamWallet, marketingWallet];

  console.log(`${colors.cyan}Funding wallets on Base Mainnet from ${signer.address}${colors.reset}`);

  if (ethAmount > 0) {
    const value = ethers.parseEther(String(ethAmount));
    const balance = await provider.getBalance(signer.address);
    const required = value * BigInt(recipients.length);
    if (balance <= required) {
      throw new Error(`Insufficient Base ETH. Balance=${ethers.formatEther(balance)} ETH, transfers require ${ethers.formatEther(required)} ETH plus gas.`);
    }

    for (const recipient of recipients) {
      const tx = await signer.sendTransaction({ to: recipient, value });
      console.log(`ETH transfer submitted: ${tx.hash}`);
      await tx.wait();
    }
  }

  if (aethAmount > 0) {
    const tokenAddress = requireAddress(process.env.AETH_TOKEN_ADDRESS, 'AETH_TOKEN_ADDRESS');
    const token = new ethers.Contract(
      tokenAddress,
      [
        'function transfer(address to,uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address) view returns (uint256)',
      ],
      signer,
    );
    const decimals = await token.decimals();
    const amount = ethers.parseUnits(String(aethAmount), decimals);
    const balance = await token.balanceOf(signer.address);
    const required = amount * BigInt(recipients.length);
    if (balance < required) {
      throw new Error(`Insufficient AETH. Available=${ethers.formatUnits(balance, decimals)}, required=${ethers.formatUnits(required, decimals)}`);
    }

    for (const recipient of recipients) {
      const tx = await token.transfer(recipient, amount);
      console.log(`AETH transfer submitted: ${tx.hash}`);
      await tx.wait();
    }
  }

  console.log('Wallet funding confirmed on Base Mainnet.');
}

main().catch((error) => {
  console.error(colors.red + error.message + colors.reset);
  process.exit(1);
});
