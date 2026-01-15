const { ethers } = require("hardhat");
require("dotenv").config();
const { validateOrExit, validateBalanceOrExit, colors } = require("../utils/validateEnv");

async function main() {
  console.log("\n" + colors.bold + colors.cyan + "🚀 Deploying Aetheron Platform Contracts..." + colors.reset);
  console.log("=".repeat(60) + "\n");

  // Validate environment variables before proceeding
  console.log(colors.bold + "🔍 Validating configuration..." + colors.reset);
  validateOrExit({ requireWallets: true, requireTokenAddress: false });
  console.log(colors.green + "✅ Configuration validated successfully!\n" + colors.reset);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", colors.cyan + deployer.address + colors.reset);
  
  // Check balance using the new utility
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInEther = ethers.formatEther(balance);
  console.log("Account balance:", colors.cyan + balanceInEther + " POL" + colors.reset);

  // Validate balance is sufficient for deployment
  await validateBalanceOrExit(deployer.provider, deployer.address, "0.1");

  // Read configuration from environment variables
  const TEAM_WALLET = process.env.TEAM_WALLET;
  const MARKETING_WALLET = process.env.MARKETING_WALLET;
  
  console.log("\n" + colors.bold + "📋 Configuration:" + colors.reset);
  console.log("  Team Wallet:", colors.cyan + TEAM_WALLET + colors.reset);
  console.log("  Marketing Wallet:", colors.cyan + MARKETING_WALLET + colors.reset);
  console.log("");
  
  // Deploy Aetheron Token
  console.log(colors.bold + "📜 Deploying Aetheron Token..." + colors.reset);
  
  try {
    const Aetheron = await ethers.getContractFactory("Aetheron");
    
    // We'll use deployer as staking pool initially, then update after staking contract is deployed
    const aetheron = await Aetheron.deploy(
      TEAM_WALLET,
      MARKETING_WALLET,
      deployer.address // Temporary staking pool address
    );
    
    await aetheron.waitForDeployment();
    const aetheronAddress = await aetheron.getAddress();
    console.log(colors.green + "✅ Aetheron Token deployed to: " + aetheronAddress + colors.reset);
    
    // Deploy Staking Contract
    console.log("\n" + colors.bold + "📜 Deploying Aetheron Staking..." + colors.reset);
    const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
    const staking = await AetheronStaking.deploy(aetheronAddress);
    
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log(colors.green + "✅ Aetheron Staking deployed to: " + stakingAddress + colors.reset);
    
    // Update staking pool address in token contract
    console.log("\n" + colors.bold + "🔄 Updating staking pool address in token contract..." + colors.reset);
    const updateTx = await aetheron.updateWallets(
      TEAM_WALLET,
      MARKETING_WALLET,
      stakingAddress
    );
    await updateTx.wait();
    console.log(colors.green + "✅ Staking pool address updated" + colors.reset);
    
    // Transfer staking rewards to staking contract
    console.log("\n" + colors.bold + "💰 Transferring tokens to staking contract..." + colors.reset);
    const stakingRewards = ethers.parseEther("150000000"); // 150M tokens for staking rewards
    const transferTx = await aetheron.transfer(stakingAddress, stakingRewards);
    await transferTx.wait();
    
    // Deposit rewards into staking contract
    console.log(colors.bold + "💰 Depositing rewards into staking contract..." + colors.reset);
    const depositTx = await staking.depositRewards(stakingRewards);
    await depositTx.wait();
    console.log(colors.green + "✅ Rewards deposited" + colors.reset);
    
    // Exclude staking contract from tax
    console.log("\n" + colors.bold + "🔧 Configuring token contract..." + colors.reset);
    const excludeTx = await aetheron.setExcludedFromTax(stakingAddress, true);
    await excludeTx.wait();
    console.log(colors.green + "✅ Staking contract excluded from tax" + colors.reset);
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log(colors.bold + colors.green + "🎉 DEPLOYMENT COMPLETE!" + colors.reset);
    console.log("=".repeat(60));
    console.log("\n" + colors.bold + "📋 Contract Addresses:" + colors.reset);
    console.log("  AETH Token:", colors.cyan + aetheronAddress + colors.reset);
    console.log("  Staking Contract:", colors.cyan + stakingAddress + colors.reset);
    console.log("\n" + colors.bold + "💼 Wallets:" + colors.reset);
    console.log("  Team Wallet:", TEAM_WALLET);
    console.log("  Marketing Wallet:", MARKETING_WALLET);
    console.log("  Deployer:", deployer.address);
    console.log("\n" + colors.bold + "📊 Token Distribution:" + colors.reset);
    console.log("  Total Supply: 1,000,000,000 AETH");
    console.log("  Liquidity Pool (50%): 500,000,000 AETH → Deployer");
    console.log("  Team (20%): 200,000,000 AETH → Team Wallet");
    console.log("  Marketing (15%): 150,000,000 AETH → Marketing Wallet");
    console.log("  Staking Rewards (15%): 150,000,000 AETH → Staking Contract");
    console.log("\n" + colors.bold + "🔗 Next Steps:" + colors.reset);
    console.log("  1. " + colors.yellow + "Update .env file with AETH_TOKEN_ADDRESS:" + colors.reset);
    console.log("     AETH_TOKEN_ADDRESS=" + aetheronAddress);
    console.log("  2. Verify contracts on block explorer");
    console.log("  3. Enable trading: node scripts/enable-trading.js");
    console.log("  4. Add liquidity to DEX");
    console.log("  5. Update frontend with contract addresses");
    console.log("=".repeat(60) + "\n");
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        Aetheron: aetheronAddress,
        AetheronStaking: stakingAddress
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
    
  } catch (error) {
    console.error("\n" + colors.red + "❌ DEPLOYMENT FAILED!" + colors.reset);
    console.error(colors.red + error.message + colors.reset);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Add more POL to your deployer wallet: " + deployer.address);
    } else if (error.message.includes("nonce")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Wait a few seconds and try again (nonce issue)");
    } else if (error.message.includes("network")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Check your POLYGON_RPC_URL and internet connection");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
