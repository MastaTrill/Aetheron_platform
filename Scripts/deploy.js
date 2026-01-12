// scripts/deploy.js
import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("🚀 Deploying Aetheron token to Polygon...");

  // Contract factory
  const Token = await ethers.getContractFactory("Aetheron");

  // Deploy contract with constructor args (teamWallet, marketingWallet, stakingPool)
  const token = await Token.deploy(
    "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452", // teamWallet
    "0x8D3442424F8F6BEEd97496C7E54e056166f96746", // marketingWallet
    "0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82"  // stakingPool
  );

  await token.deployed();

  console.log(`✅ Aetheron deployed at: ${token.address}`);
}

// Run deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });