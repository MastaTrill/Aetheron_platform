// scripts/deploy.js
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying AetherX token to Polygon...");

  // Contract factory
  const Token = await ethers.getContractFactory("InstantLiquidityToken");

  // Deploy contract (ERC20Upgradeable may not need constructor args)
  const token = await Token.deploy("AetherX", "AETHX", ethers.utils.parseUnits("1000000", 18));

  await token.deployed();

  console.log(`✅ AetherX deployed at: ${token.address}`);
}

// Run deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });