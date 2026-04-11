// scripts/reset-nonce.js
// Simple transfer to self to reset nonce

import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Current address:", deployer.address);

  // Get current nonce
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Current nonce:", nonce);

  // Send 0 MATIC to self (just to increment nonce)
  // This costs gas but resets nonce
  const tx = {
    to: deployer.address,
    value: 0,
    gasLimit: 21000,
  };

  const response = await deployer.sendTransaction(tx);
  console.log("Transaction sent:", response.hash);
  console.log("New nonce will be:", nonce + 1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
