// interact-mainnet.js
// Script to test mint, transfer, stake, and claim on deployed Polygon contracts
// Usage: node interact-mainnet.js

import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Load ABIs
const aetheronAbi = JSON.parse(fs.readFileSync("./artifacts/contracts/Aetheron.sol/Aetheron.json", "utf8")).abi;
const stakingAbi = JSON.parse(fs.readFileSync("./artifacts/contracts/AetheronStaking.sol/AetheronStaking.json", "utf8")).abi;

// Addresses from deployment-info.json
const AETHERON_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const STAKING_ADDRESS = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";

// Set up provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
  // Mint tokens (if allowed)
  const aetheron = new ethers.Contract(AETHERON_ADDRESS, aetheronAbi, signer);
  console.log("Minting tokens...");
  // Uncomment and adjust if mint is public or owner-only
  // const mintTx = await aetheron.mint(signer.address, ethers.utils.parseUnits("1000", 18));
  // await mintTx.wait();
  // console.log("Minted 1000 tokens");

  // Transfer tokens
  console.log("Transferring tokens...");
  const transferTx = await aetheron.transfer("<RECIPIENT_ADDRESS>", ethers.utils.parseUnits("10", 18));
  await transferTx.wait();
  console.log("Transferred 10 tokens");

  // Approve staking contract
  console.log("Approving staking contract...");
  const approveTx = await aetheron.approve(STAKING_ADDRESS, ethers.utils.parseUnits("10", 18));
  await approveTx.wait();
  console.log("Approved 10 tokens for staking");

  // Stake tokens
  const staking = new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer);
  console.log("Staking tokens...");
  const stakeTx = await staking.stake(ethers.utils.parseUnits("10", 18));
  await stakeTx.wait();
  console.log("Staked 10 tokens");

  // Claim rewards
  console.log("Claiming rewards...");
  const claimTx = await staking.claim();
  await claimTx.wait();
  console.log("Claimed staking rewards");
}

main().catch(console.error);
