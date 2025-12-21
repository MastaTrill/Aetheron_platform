const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Aetheron Platform Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration - Update these addresses for your deployment
  const TEAM_WALLET = "0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784";
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
  
  await aetheron.deployed();
  console.log("✅ Aetheron Token deployed to:", aetheron.address);
  
  // Deploy Staking Contract
  console.log("\n📜 Deploying Aetheron Staking...");
  const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
  const staking = await AetheronStaking.deploy(aetheron.address);
  
  await staking.deployed();
  console.log("✅ Aetheron Staking deployed to:", staking.address);
  
  // Update staking pool address in token contract
  console.log("\n🔄 Updating staking pool address in token contract...");
  const updateTx = await aetheron.updateWallets(
    TEAM_WALLET,
    MARKETING_WALLET,
    staking.address
  );
  await updateTx.wait();
  console.log("✅ Staking pool address updated");
  
  // Transfer staking rewards to staking contract
  console.log("\n💰 Transferring tokens to staking contract...");
  const stakingRewards = ethers.utils.parseEther("150000000"); // 150M tokens for staking rewards
  const transferTx = await aetheron.transfer(staking.address, stakingRewards);
  await transferTx.wait();
  
  // Deposit rewards into staking contract
  console.log("💰 Depositing rewards into staking contract...");
  const depositTx = await staking.depositRewards(stakingRewards);
  await depositTx.wait();
  console.log("✅ Rewards deposited");
  
  // Exclude staking contract from tax
  console.log("\n🔧 Configuring token contract...");
  const excludeTx = await aetheron.setExcludedFromTax(staking.address, true);
  await excludeTx.wait();
  console.log("✅ Staking contract excluded from tax");
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("  AETH Token:", aetheron.address);
  console.log("  Staking Contract:", staking.address);
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
      Aetheron: aetheron.address,
      AetheronStaking: staking.address
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
