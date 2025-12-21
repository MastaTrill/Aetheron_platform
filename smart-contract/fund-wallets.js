// fund-wallets.js
// Script to send MATIC or Aetheron tokens to team and marketing wallets
// Usage: node fund-wallets.js

const { ethers } = require("ethers");
require("dotenv").config();

const TEAM_WALLET = process.env.TEAM_WALLET || "0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784";
const MARKETING_WALLET = process.env.MARKETING_WALLET || "0x8a3ad49656bd07981c9cfc7ad826a808847c3452";
const AETHERON_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const aetheronAbi = require("./artifacts/contracts/Aetheron.sol/Aetheron.json").abi;

if (!process.env.POLYGON_RPC_URL || !process.env.PRIVATE_KEY) {
  throw new Error("Missing POLYGON_RPC_URL or PRIVATE_KEY in .env file");
}
const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function sendMatic(to, amount) {
  const tx = await signer.sendTransaction({
    to,
    value: ethers.utils.parseEther(amount)
  });
  await tx.wait();
  console.log(`Sent ${amount} MATIC to ${to}`);
}

async function sendAetheron(to, amount) {
  const token = new ethers.Contract(AETHERON_ADDRESS, aetheronAbi, signer);
  const tx = await token.transfer(to, ethers.utils.parseUnits(amount, 18));
  await tx.wait();
  console.log(`Sent ${amount} Aetheron tokens to ${to}`);
}

async function main() {
  // Example: send 1 MATIC and 1000 Aetheron tokens to each wallet
  await sendMatic(TEAM_WALLET, "1");
  await sendMatic(MARKETING_WALLET, "1");
  await sendAetheron(TEAM_WALLET, "1000");
  await sendAetheron(MARKETING_WALLET, "1000");
}

main().catch(console.error);
