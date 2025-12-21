const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 AETHERON PLATFORM - FRESH DEPLOYMENT");
  console.log("=".repeat(60) + "\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL");
  
  if (balance === 0n) {
    console.error("\n❌ ERROR: Deployer account has no POL!");
    console.log("Please fund your wallet before deploying.");
    process.exit(1);
  }

  // Configuration - Update these addresses
  const TEAM_WALLET = process.env.TEAM_WALLET || "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
  const MARKETING_WALLET = process.env.MARKETING_WALLET || "0x8a3ad49656bd07981c9cfc7ad826a808847c3452";
  
  console.log("\n📋 Configuration:");
  console.log("  Team Wallet:", TEAM_WALLET);
  console.log("  Marketing Wallet:", MARKETING_WALLET);
  console.log("  Deployer:", deployer.address);

  // Step 1: Deploy Aetheron Token
  console.log("\n" + "-".repeat(60));
  console.log("Step 1/5: Deploying Aetheron Token Contract...");
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
  console.log("✅ Aetheron Token deployed to:", aetheronAddress);

  // Step 2: Deploy Staking Contract
  console.log("\n" + "-".repeat(60));
  console.log("Step 2/5: Deploying Aetheron Staking Contract...");
  console.log("-".repeat(60));
  
  const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
  const staking = await AetheronStaking.deploy(aetheronAddress);
  
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Aetheron Staking deployed to:", stakingAddress);

  // Step 3: Update staking pool address in token contract
  console.log("\n" + "-".repeat(60));
  console.log("Step 3/5: Updating Token Contract Configuration...");
  console.log("-".repeat(60));
  
  console.log("  📝 Updating staking pool address...");
  const updateTx = await aetheron.updateWallets(
    TEAM_WALLET,
    MARKETING_WALLET,
    stakingAddress
  );
  await updateTx.wait();
  console.log("  ✅ Staking pool address updated");
  
  console.log("  📝 Excluding staking contract from tax...");
  const excludeTx = await aetheron.setExcludedFromTax(stakingAddress, true);
  await excludeTx.wait();
  console.log("  ✅ Staking contract excluded from tax");

  // Step 4: Transfer and setup staking rewards
  console.log("\n" + "-".repeat(60));
  console.log("Step 4/5: Setting Up Staking Rewards...");
  console.log("-".repeat(60));
  
  const stakingRewards = ethers.parseEther("150000000"); // 150M tokens
  
  console.log("  💰 Transferring 150M AETH to staking contract...");
  const transferTx = await aetheron.transfer(stakingAddress, stakingRewards);
  await transferTx.wait();
  console.log("  ✅ Transfer complete");
  
  console.log("  💰 Depositing rewards into staking contract...");
  const depositTx = await staking.depositRewards(stakingRewards);
  await depositTx.wait();
  console.log("  ✅ Rewards deposited");

  // Step 5: Verify deployment
  console.log("\n" + "-".repeat(60));
  console.log("Step 5/5: Verifying Deployment...");
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
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  
  console.log("\n📊 DEPLOYMENT SUMMARY:");
  console.log("\n🔗 Contract Addresses:");
  console.log("  AETH Token:        ", aetheronAddress);
  console.log("  Staking Contract:  ", stakingAddress);
  
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
  
  console.log("\n📝 Next Steps:");
  console.log("  1. ✅ Contracts deployed and configured");
  console.log("  2. 🔍 Verify contracts on PolygonScan:");
  console.log("     npx hardhat verify --network polygon " + aetheronAddress + ' "' + TEAM_WALLET + '" "' + MARKETING_WALLET + '" "' + stakingAddress + '"');
  console.log("     npx hardhat verify --network polygon " + stakingAddress + ' "' + aetheronAddress + '"');
  console.log("  3. 🚀 Enable trading (when ready):");
  console.log("     Run: node scripts/enable-trading.js");
  console.log("  4. 💧 Add liquidity to DEX (Uniswap/Quickswap)");
  console.log("  5. 🌐 Update frontend with contract addresses");
  
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error(error);
    process.exit(1);
  });
