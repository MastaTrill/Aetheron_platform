// check-balance.js
// Quick script to check MATIC and Aetheron token balance
const { ethers } = require("ethers");
require("dotenv").config();

const AETHERON_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const aetheronAbi = require("./artifacts/contracts/Aetheron.sol/Aetheron.json").abi;

if (!process.env.POLYGON_RPC_URL || !process.env.PRIVATE_KEY) {
  throw new Error("Missing POLYGON_RPC_URL or PRIVATE_KEY in .env file");
}

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function checkBalance() {
  const address = wallet.address;
  console.log(`Wallet address: ${address}`);

  // Check MATIC balance
  const maticBalance = await provider.getBalance(address);
  console.log(`MATIC balance: ${ethers.formatEther(maticBalance)} MATIC`);

  // Check Aetheron token balance
  const token = new ethers.Contract(AETHERON_ADDRESS, aetheronAbi, provider);
  const tokenBalance = await token.balanceOf(address);
  console.log(`Aetheron balance: ${ethers.formatUnits(tokenBalance, 18)} AETH`);

  // Check nonce
  const nonce = await provider.getTransactionCount(address, "pending");
  console.log(`Current nonce: ${nonce}`);
}

checkBalance().catch(console.error);