const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Aetheron Platform Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration - Update these addresses for your deployment
  const TEAM_WALLET = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
  const MARKETING_WALLET = "0x8a3ad49656bd07981c9cfc7ad826a808847c3452";
  
  // Deploy Aetheron Token
  console.log("\n📜 Deploying Aetheron Token...");
  const Aetheron = await ethers.getContractFactory("Aetheron");
  
  // We'll use deployer as staking pool initially, then update after staking contract is deployed
  const aetheron = await Aetheron.deploy(
    TEAM_WALLET,
    MARKETING_WALLET,
    deployer.address // Temporary staking pool address
  );
  
  console.log("✅ Aetheron Token deployed to:", await aetheron.getAddress());
  
  // Deploy Staking Contract
  console.log("\n📜 Deploying Aetheron Staking...");
  const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
  const staking = await AetheronStaking.deploy(await aetheron.getAddress());
  
  console.log("✅ Aetheron Staking deployed to:", await staking.getAddress());
  
  // Update staking pool address in token contract
  console.log("\n🔄 Updating staking pool address in token contract...");
  const updateTx = await aetheron.updateWallets(
    TEAM_WALLET,
    MARKETING_WALLET,
    await staking.getAddress()
  );
  await updateTx.wait();
  console.log("✅ Staking pool address updated");
  
  // Transfer staking rewards to staking contract
  console.log("\n💰 Transferring tokens to staking contract...");
  const stakingRewards = ethers.parseEther("150000000"); // 150M tokens for staking rewards
  const transferTx = await aetheron.transfer(await staking.getAddress(), stakingRewards);
  await transferTx.wait();
  
  // Deposit rewards into staking contract
  console.log("💰 Depositing rewards into staking contract...");
  const depositTx = await staking.depositRewards(stakingRewards);
  await depositTx.wait();
  console.log("✅ Rewards deposited");
  
  // Exclude staking contract from tax
  console.log("\n🔧 Configuring token contract...");
  const excludeTx = await aetheron.setExcludedFromTax(await staking.getAddress(), true);
  await excludeTx.wait();
  console.log("✅ Staking contract excluded from tax");
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("  AETH Token:", await aetheron.getAddress());
  console.log("  Staking Contract:", await staking.getAddress());
  console.log("\n💼 Wallets:");
  console.log("  Team Wallet:", TEAM_WALLET);
  console.log("  Marketing Wallet:", MARKETING_WALLET);
  console.log("  Deployer:", deployer.address);
  console.log("\n📊 Token Distribution:");
  console.log("  Total Supply: 1,000,000,000 AETH");
  console.log("  Liquidity Pool (50%): 500,000,000 AETH → Deployer");
  console.log("  Team (20%): 200,000,000 AETH → Team Wallet");
  console.log("  Marketing (15%): 150,000,000 AETH → Marketing Wallet");
  console.log("  Staking Rewards (15%): 150,000,000 AETH → Staking Contract");
  console.log("\n🔗 Next Steps:");
  console.log("  1. Verify contracts on block explorer");
  console.log("  2. Enable trading: await aetheron.enableTrading()");
  console.log("  3. Add liquidity to DEX");
  console.log("  4. Update frontend with contract addresses");
  console.log("=".repeat(60) + "\n");
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      Aetheron: await aetheron.getAddress(),
      AetheronStaking: await staking.getAddress()
    },
    wallets: {
      team: TEAM_WALLET,
      marketing: MARKETING_WALLET,
      deployer: deployer.address
    }
  };
  
  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
