import hre from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { ethers } = hre;

  console.log("\n🚀 Deploying AetxSubscription to Base...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const AetxSubscription = await ethers.getContractFactory("AetxSubscription");
  const subscription = await AetxSubscription.deploy();
  await subscription.waitForDeployment();

  const address = await subscription.getAddress();
  console.log("✅ AetxSubscription deployed to:", address);

  console.log("\n📋 Next steps:");
  console.log("1. Update .env with BASE_RPC_URL");
  console.log("2. Verify: npx hardhat verify --network base", address);
  console.log("3. Set tiers as needed via setTier()\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
