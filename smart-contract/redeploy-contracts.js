// redeploy-contracts.js
// Redeploy Aetheron contracts with proper EOA addresses

const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Connect to Polygon
  const provider = new hre.ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying from address:", signer.address);

  // EOA addresses for token allocation
  const TEAM_WALLET = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";      // Team allocation
  const MARKETING_WALLET = "0x8D3442424F8F6BEEd97496C7E54e056166f96746"; // Marketing allocation
  const STAKING_POOL = "0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82";    // Staking pool (liquidity wallet)

  console.log("Team Wallet:", TEAM_WALLET);
  console.log("Marketing Wallet:", MARKETING_WALLET);
  console.log("Staking Pool:", STAKING_POOL);

  // Deploy Aetheron contract
  console.log("\n📄 Deploying Aetheron contract...");
  const Aetheron = await hre.ethers.getContractFactory("Aetheron");
  const aetheron = await Aetheron.deploy(TEAM_WALLET, MARKETING_WALLET, STAKING_POOL);
  await aetheron.waitForDeployment();

  const aetheronAddress = await aetheron.getAddress();
  console.log("✅ Aetheron deployed at:", aetheronAddress);

  // Deploy AetheronStaking contract
  console.log("\n📄 Deploying AetheronStaking contract...");
  const AetheronStaking = await hre.ethers.getContractFactory("AetheronStaking");
  const staking = await AetheronStaking.deploy(aetheronAddress);
  await staking.waitForDeployment();

  const stakingAddress = await staking.getAddress();
  console.log("✅ AetheronStaking deployed at:", stakingAddress);

  // Enable trading
  console.log("\n🔓 Enabling trading...");
  const enableTx = await aetheron.enableTrading();
  await enableTx.wait();
  console.log("✅ Trading enabled");

  // Verify token balances
  console.log("\n💰 Checking token balances...");
  const totalSupply = await aetheron.totalSupply();
  const liquidityBalance = await aetheron.balanceOf(signer.address);
  const teamBalance = await aetheron.balanceOf(TEAM_WALLET);
  const marketingBalance = await aetheron.balanceOf(MARKETING_WALLET);
  const stakingBalance = await aetheron.balanceOf(STAKING_POOL);

  console.log("Total Supply:", hre.ethers.formatEther(totalSupply), "AETH");
  console.log("Liquidity (deployer):", hre.ethers.formatEther(liquidityBalance), "AETH");
  console.log("Team Wallet:", hre.ethers.formatEther(teamBalance), "AETH");
  console.log("Marketing Wallet:", hre.ethers.formatEther(marketingBalance), "AETH");
  console.log("Staking Pool:", hre.ethers.formatEther(stakingBalance), "AETH");

  // Save deployment info
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: signer.address,
    contracts: {
      Aetheron: {
        address: aetheronAddress,
        args: [TEAM_WALLET, MARKETING_WALLET, STAKING_POOL]
      },
      AetheronStaking: {
        address: stakingAddress,
        args: [aetheronAddress]
      }
    }
  };

  console.log("\n📋 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Redeployment complete!");
  console.log("🔗 Aetheron:", aetheronAddress);
  console.log("🔗 Staking:", stakingAddress);
}

main().catch(console.error);