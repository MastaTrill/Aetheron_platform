require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 AETHERON PLATFORM - DIRECT DEPLOYMENT");
  console.log("=".repeat(60) + "\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC || 'https://polygon-rpc.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("📍 Deploying from account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL");
  
  if (balance === 0n) {
    console.error("\n❌ ERROR: Deployer account has no POL!");
    process.exit(1);
  }

  // Configuration
  const TEAM_WALLET = process.env.TEAM_WALLET || "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
  const MARKETING_WALLET = process.env.MARKETING_WALLET || wallet.address;
  
  console.log("\n📋 Configuration:");
  console.log("  Team Wallet:", TEAM_WALLET);
  console.log("  Marketing Wallet:", MARKETING_WALLET);
  console.log("  Deployer:", wallet.address);

  // Load contract artifacts
  const AetheronArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8')
  );
  const StakingArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/AetheronStaking.sol/AetheronStaking.json', 'utf8')
  );

  // Step 1: Deploy AETH Token with deployer as temporary staking pool
  console.log("\n" + "━".repeat(60));
  console.log("STEP 1: Deploying AETH Token");
  console.log("━".repeat(60));
  
  const AetheronFactory = new ethers.ContractFactory(
    AetheronArtifact.abi,
    AetheronArtifact.bytecode,
    wallet
  );
  
  // Deploy with deployer as temporary staking pool (tokens minted to deployer)
  console.log("📤 Sending token deployment transaction...");
  const aetheron = await AetheronFactory.deploy(TEAM_WALLET, MARKETING_WALLET, wallet.address);
  console.log("⏳ Waiting for token deployment...");
  await aetheron.waitForDeployment();
  
  const aetheronAddress = await aetheron.getAddress();
  console.log("✅ AETH Token deployed to:", aetheronAddress);

  // Step 2: Deploy Staking Contract
  console.log("\n" + "━".repeat(60));
  console.log("STEP 2: Deploying Staking Contract");
  console.log("━".repeat(60));
  
  const StakingFactory = new ethers.ContractFactory(
    StakingArtifact.abi,
    StakingArtifact.bytecode,
    wallet
  );
  
  console.log("📤 Sending staking deployment transaction...");
  const staking = await StakingFactory.deploy(aetheronAddress);
  console.log("⏳ Waiting for staking deployment...");
  await staking.waitForDeployment();
  
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking Contract deployed to:", stakingAddress);

  // Step 3: Transfer staking rewards to staking contract
  console.log("\n" + "━".repeat(60));
  console.log("STEP 3: Funding Staking Contract");
  console.log("━".repeat(60));
  
  const STAKING_REWARDS = ethers.parseEther("150000000"); // 150M tokens (15%)
  console.log("📤 Transferring", ethers.formatEther(STAKING_REWARDS), "AETH to staking...");
  const fundTx = await aetheron.transfer(stakingAddress, STAKING_REWARDS);
  await fundTx.wait();
  console.log("✅ Staking contract funded with", ethers.formatEther(STAKING_REWARDS), "AETH");

  // Step 4: Verify Token Distribution
  console.log("\n" + "━".repeat(60));
  console.log("STEP 4: Verification");
  console.log("━".repeat(60));

  // Verify balances
  console.log("\n" + "━".repeat(60));
  console.log("STEP 5: Verification");
  console.log("━".repeat(60));
  
  const deployerBalance = await aetheron.balanceOf(wallet.address);
  const stakingBalance = await aetheron.balanceOf(stakingAddress);
  const teamBalance = await aetheron.balanceOf(TEAM_WALLET);
  const marketingBalance = await aetheron.balanceOf(MARKETING_WALLET);
  
  console.log("\n📊 Token Distribution:");
  console.log("  Deployer:", ethers.formatEther(deployerBalance), "AETH");
  console.log("  Staking:", ethers.formatEther(stakingBalance), "AETH");
  console.log("  Team:", ethers.formatEther(teamBalance), "AETH");
  console.log("  Marketing:", ethers.formatEther(marketingBalance), "AETH");

  // Final balance
  const finalBalance = await provider.getBalance(wallet.address);
  const gasUsed = balance - finalBalance;
  console.log("\n⛽ Gas Used:", ethers.formatEther(gasUsed), "POL");
  console.log("💰 Remaining Balance:", ethers.formatEther(finalBalance), "POL");

  // Save deployment info
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      Aetheron: {
        address: aetheronAddress,
        args: [TEAM_WALLET, MARKETING_WALLET]
      },
      AetheronStaking: {
        address: stakingAddress,
        args: [aetheronAddress]
      }
    },
    configuration: {
      teamWallet: TEAM_WALLET,
      marketingWallet: MARKETING_WALLET,
      stakingRewards: STAKING_REWARDS.toString()
    },
    gasUsed: gasUsed.toString()
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📁 Deployment info saved to: deployment-info.json");
  console.log("\n📝 Next Steps:");
  console.log("  1. Enable trading: node scripts/enable-trading.js");
  console.log("  2. Verify contracts on PolygonScan");
  console.log("  3. Add liquidity to DEX");
  console.log("  4. Update frontend with new addresses\n");
  
  console.log("📋 Contract Addresses:");
  console.log("  AETH Token:", aetheronAddress);
  console.log("  Staking:", stakingAddress);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:", error);
    process.exit(1);
  });
