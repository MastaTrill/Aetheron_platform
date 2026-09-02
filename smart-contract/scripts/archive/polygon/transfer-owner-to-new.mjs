import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';

const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon.drpc.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AETH_TOKEN = process.env.AETHERON_TOKEN_ADDRESS || '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const NEW_OWNER = process.env.NEW_OWNER_ADDRESS || '0xDF5A2b892254C42F80000A029dfE8b311f777Bd5';

if (!PRIVATE_KEY) {
  console.error('PRIVATE_KEY is required in .env for the current owner');
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Current signer (must be on-chain owner):', wallet.address);
  console.log('New owner target:', NEW_OWNER);

  const tokenAbi = [
    'function owner() view returns (address)',
    'function transferOwnership(address newOwner)',
  ];
  const token = new ethers.Contract(AETH_TOKEN, tokenAbi, wallet);

  const currentOwner = await token.owner();
  console.log('On-chain owner:', currentOwner);

  if (currentOwner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error('Signer is NOT the current contract owner. Aborting.');
    process.exit(1);
  }

  console.log('Sending transferOwnership...');
  const tx = await token.transferOwnership(NEW_OWNER);
  console.log('Tx hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed in block:', receipt.blockNumber);

  const updatedOwner = await token.owner();
  console.log('Updated owner:', updatedOwner);
  if (updatedOwner.toLowerCase() === NEW_OWNER.toLowerCase()) {
    console.log('Ownership transfer successful');
  } else {
    console.error('Ownership transfer may have failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Transfer failed:', error);
  process.exit(1);
});
