const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();
const { validateOrExit, validateBalanceOrExit, colors } = require("../utils/validateEnv");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log(colors.bold + colors.cyan + "🚀 AETHERON PLATFORM - FRESH DEPLOYMENT" + colors.reset);
  console.log("=".repeat(60) + "\n");

  // Validate environment variables before proceeding
  console.log(colors.bold + "🔍 Validating configuration..." + colors.reset);
  validateOrExit({ requireWallets: true, requireTokenAddress: false });
  console.log(colors.green + "✅ Configuration validated successfully!\n" + colors.reset);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from account:", colors.cyan + deployer.address + colors.reset);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", colors.cyan + ethers.formatEther(balance) + " POL" + colors.reset);
  
  if (balance === 0n) {
    console.error("\n" + colors.red + "❌ ERROR: Deployer account has no POL!" + colors.reset);
    console.log(colors.yellow + "💡 Solution:" + colors.reset);
    console.log("   Please fund your wallet before deploying: " + deployer.address);
    process.exit(1);
  }

  // Validate balance is sufficient for deployment
  await validateBalanceOrExit(ethers.provider, deployer.address, "0.1");

  // Configuration - Read from environment variables
  const TEAM_WALLET = process.env.TEAM_WALLET;
  const MARKETING_WALLET = process.env.MARKETING_WALLET;
  
  console.log("\n📋 Configuration:");
  console.log("  Team Wallet:", colors.cyan + TEAM_WALLET + colors.reset);
  console.log("  Marketing Wallet:", colors.cyan + MARKETING_WALLET + colors.reset);
  console.log("  Deployer:", deployer.address);

  try {

  // Step 1: Deploy Aetheron Token
  console.log("\n" + "-".repeat(60));
  console.log(colors.bold + "Step 1/5: Deploying Aetheron Token Contract..." + colors.reset);
  console.log("-".repeat(60));
  
  const Aetheron = await ethers.getContractFactory("Aetheron");
  
  // Deploy with deployer as temporary staking pool
  const aetheron = await Aetheron.deploy(
    TEAM_WALLET,
    MARKETING_WALLET,
    deployer.address // Temporary - will update after staking contract deploys
  );
  
  await aetheron.waitForDeployment();
  const aetheronAddress = await aetheron.getAddress();
  console.log(colors.green + "✅ Aetheron Token deployed to: " + aetheronAddress + colors.reset);

  // Step 2: Deploy Staking Contract
  console.log("\n" + "-".repeat(60));
  console.log(colors.bold + "Step 2/5: Deploying Aetheron Staking Contract..." + colors.reset);
  console.log("-".repeat(60));
  
  const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
  const staking = await AetheronStaking.deploy(aetheronAddress);
  
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(colors.green + "✅ Aetheron Staking deployed to: " + stakingAddress + colors.reset);

  // Step 3: Update staking pool address in token contract
  console.log("\n" + "-".repeat(60));
  console.log(colors.bold + "Step 3/5: Updating Token Contract Configuration..." + colors.reset);
  console.log("-".repeat(60));
  
  console.log("  📝 Updating staking pool address...");
  const updateTx = await aetheron.updateWallets(
    TEAM_WALLET,
    MARKETING_WALLET,
    stakingAddress
  );
  await updateTx.wait();
  console.log(colors.green + "  ✅ Staking pool address updated" + colors.reset);
  
  console.log("  📝 Excluding staking contract from tax...");
  const excludeTx = await aetheron.setExcludedFromTax(stakingAddress, true);
  await excludeTx.wait();
  console.log(colors.green + "  ✅ Staking contract excluded from tax" + colors.reset);

  // Step 4: Transfer and setup staking rewards
  console.log("\n" + "-".repeat(60));
  console.log(colors.bold + "Step 4/5: Setting Up Staking Rewards..." + colors.reset);
  console.log("-".repeat(60));
  
  const stakingRewards = ethers.parseEther("150000000"); // 150M tokens
  
  console.log("  💰 Transferring 150M AETH to staking contract...");
  const transferTx = await aetheron.transfer(stakingAddress, stakingRewards);
  await transferTx.wait();
  console.log(colors.green + "  ✅ Transfer complete" + colors.reset);
  
  console.log("  💰 Depositing rewards into staking contract...");
  const depositTx = await staking.depositRewards(stakingRewards);
  await depositTx.wait();
  console.log(colors.green + "  ✅ Rewards deposited" + colors.reset);

  // Step 5: Verify deployment
  console.log("\n" + "-".repeat(60));
  console.log(colors.bold + "Step 5/5: Verifying Deployment..." + colors.reset);
  console.log("-".repeat(60));
  
  const totalSupply = await aetheron.totalSupply();
  const stakingBalance = await aetheron.balanceOf(stakingAddress);
  const teamBalance = await aetheron.balanceOf(TEAM_WALLET);
  const marketingBalance = await aetheron.balanceOf(MARKETING_WALLET);
  const deployerBalance = await aetheron.balanceOf(deployer.address);
  const tradingEnabled = await aetheron.tradingEnabled();
  const poolCount = await staking.poolCount();
  const rewardBalance = await staking.rewardBalance();

  console.log("  ✅ Token total supply:", ethers.formatEther(totalSupply), "AETH");
  console.log("  ✅ Staking balance:", ethers.formatEther(stakingBalance), "AETH");
  console.log("  ✅ Team balance:", ethers.formatEther(teamBalance), "AETH");
  console.log("  ✅ Marketing balance:", ethers.formatEther(marketingBalance), "AETH");
  console.log("  ✅ Deployer balance:", ethers.formatEther(deployerBalance), "AETH");
  console.log("  ✅ Trading enabled:", tradingEnabled);
  console.log("  ✅ Staking pools created:", poolCount.toString());
  console.log("  ✅ Reward pool balance:", ethers.formatEther(rewardBalance), "AETH");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(colors.bold + colors.green + "🎉 DEPLOYMENT SUCCESSFUL!" + colors.reset);
  console.log("=".repeat(60));
  
  console.log("\n" + colors.bold + "📊 DEPLOYMENT SUMMARY:" + colors.reset);
  console.log("\n🔗 Contract Addresses:");
  console.log("  AETH Token:        ", colors.cyan + aetheronAddress + colors.reset);
  console.log("  Staking Contract:  ", colors.cyan + stakingAddress + colors.reset);
  
  console.log("\n💼 Wallet Addresses:");
  console.log("  Team Wallet:       ", TEAM_WALLET);
  console.log("  Marketing Wallet:  ", MARKETING_WALLET);
  console.log("  Deployer:          ", deployer.address);
  
  console.log("\n💰 Token Distribution:");
  console.log("  Total Supply:      1,000,000,000 AETH");
  console.log("  ├─ Liquidity Pool: ", ethers.formatEther(deployerBalance), "AETH → Deployer");
  console.log("  ├─ Team:           ", ethers.formatEther(teamBalance), "AETH → Team Wallet");
  console.log("  ├─ Marketing:      ", ethers.formatEther(marketingBalance), "AETH → Marketing Wallet");
  console.log("  └─ Staking:        ", ethers.formatEther(stakingBalance), "AETH → Staking Contract");
  
  console.log("\n🏊 Staking Pools:");
  console.log("  Pool 0: 30 days  @ 5% APY");
  console.log("  Pool 1: 90 days  @ 12% APY");
  console.log("  Pool 2: 180 days @ 25% APY");
  
  console.log("\n⚙️ Configuration:");
  console.log("  Trading Enabled:   ", tradingEnabled ? "✅ YES" : "❌ NO (call enableTrading())");
  console.log("  Buy Tax:           3%");
  console.log("  Sell Tax:          5%");
  
  console.log("\n" + colors.bold + "📝 Next Steps:" + colors.reset);
  console.log("  1. ✅ Contracts deployed and configured");
  console.log("  2. " + colors.yellow + "Update .env file with AETH_TOKEN_ADDRESS:" + colors.reset);
  console.log("     AETH_TOKEN_ADDRESS=" + aetheronAddress);
  console.log("  3. 🔍 Verify contracts on PolygonScan:");
  console.log("     npx hardhat verify --network polygon " + aetheronAddress + ' "' + TEAM_WALLET + '" "' + MARKETING_WALLET + '" "' + stakingAddress + '"');
  console.log("     npx hardhat verify --network polygon " + stakingAddress + ' "' + aetheronAddress + '"');
  console.log("  4. 🚀 Enable trading (when ready):");
  console.log("     Run: node scripts/enable-trading.js");
  console.log("  5. 💧 Add liquidity to DEX (Uniswap/Quickswap)");
  console.log("  6. 🌐 Update frontend with contract addresses");
  
  console.log("\n🔗 Block Explorer Links:");
  console.log("  Token:   https://polygonscan.com/address/" + aetheronAddress);
  console.log("  Staking: https://polygonscan.com/address/" + stakingAddress);
  
  console.log("\n" + "=".repeat(60) + "\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      Aetheron: {
        address: aetheronAddress,
        totalSupply: ethers.formatEther(totalSupply),
        tradingEnabled: tradingEnabled
      },
      AetheronStaking: {
        address: stakingAddress,
        poolCount: poolCount.toString(),
        rewardBalance: ethers.formatEther(rewardBalance)
      }
    },
    wallets: {
      team: TEAM_WALLET,
      marketing: MARKETING_WALLET,
      deployer: deployer.address
    },
    balances: {
      team: ethers.formatEther(teamBalance),
      marketing: ethers.formatEther(marketingBalance),
      staking: ethers.formatEther(stakingBalance),
      deployer: ethers.formatEther(deployerBalance)
    }
  };
  
  const deploymentPath = `deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);
  console.log("");
  
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
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error(error);
    process.exit(1);
  });
