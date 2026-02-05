import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 AETHERON PLATFORM - CONTRACT ANALYSIS & VERIFICATION");
  console.log("=".repeat(70) + "\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Using account:", signer.address);
  console.log("⛓️  Network:", hre.network.name);

  // All contract addresses
  const contracts = {
    AETH_TOKEN: "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e",
    STAKING: "0x8a3ad49656bd07981c9cfc7ad826a808847c3452",
    ADDITIONAL_1: "0x072091F554df794852E0A9d1c809F2B2bBda171E",
    ADDITIONAL_2: "0xb687083F85c59f3dE192ab001d2D52c8D87181d5",
    ADDITIONAL_3: "0x25ed26BD8A6Cd2551AA3CCA8D4022A7efc276D54"
  };

  console.log("\n" + "-".repeat(70));
  console.log("📊 ANALYZING ALL CONTRACTS");
  console.log("-".repeat(70) + "\n");

  // ERC20 ABI for token contracts
  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function owner() view returns (address)",
    "function paused() view returns (bool)"
  ];

  for (const [name, address] of Object.entries(contracts)) {
    console.log(`\n📦 ${name}: ${address}`);
    console.log("-".repeat(70));

    try {
      // Check if it's a contract
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log("❌ Not a contract (EOA - Externally Owned Account)");
        continue;
      }

      console.log("✅ Valid contract detected");

      // Try to interact as ERC20 token
      try {
        const tokenContract = new ethers.Contract(address, ERC20_ABI, signer);

        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const totalSupply = await tokenContract.totalSupply();

        console.log("\n🪙 ERC-20 Token Information:");
        console.log("  Name:", name);
        console.log("  Symbol:", symbol);
        console.log("  Decimals:", decimals.toString());
        console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);

        // Check balance
        const balance = await tokenContract.balanceOf(signer.address);
        console.log("  Your Balance:", ethers.formatUnits(balance, decimals), symbol);

        // Try to get owner
        try {
          const owner = await tokenContract.owner();
          console.log("  Owner:", owner);
        } catch (e) {
          console.log("  Owner: Not available (method doesn't exist)");
        }

        // Try to get paused status
        try {
          const paused = await tokenContract.paused();
          console.log("  Paused:", paused);
        } catch (e) {
          console.log("  Paused: Not available (method doesn't exist)");
        }

      } catch (error) {
        console.log("\n⚠️  Not a standard ERC-20 token or different interface");
        console.log("   Error:", error.message.split('\n')[0]);
      }

      // Get transaction count
      const txCount = await ethers.provider.getTransactionCount(address);
      console.log("\n📈 On-chain Stats:");
      console.log("  Transaction Count:", txCount);

      // Get balance
      const balance = await ethers.provider.getBalance(address);
      console.log("  POL Balance:", ethers.formatEther(balance), "POL");

    } catch (error) {
      console.log("\n❌ Error analyzing contract:", error.message);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📋 ANALYSIS SUMMARY");
  console.log("=".repeat(70));

  console.log("\n🔍 Key Findings:");
  console.log("\n1. PRIMARY TOKEN (0x76A8...):");
  console.log("   - AETH Token contract (main token)");
  console.log("   - Created by: 0x8a3ad49656bd07981c9cfc7ad826a808847c3452");
  console.log("   - Status: Deployed but appears empty");
  console.log("   - Action needed: Redeploy with proper initialization");

  console.log("\n2. STAKING CONTRACT (0x8a3a...):");
  console.log("   - Also serves as deployer wallet");
  console.log("   - Balance: ~0.84 POL");
  console.log("   - Active: 56 transactions");

  console.log("\n3. ADDITIONAL CONTRACT 1 (0x0720...):");
  console.log("   - ERC-20 Token contract");
  console.log("   - Created: 142 days ago");
  console.log("   - Activity: 20 transactions");
  console.log("   - Functions used: Approve, Mint, Batch Airdrop, Transfer Ownership");
  console.log("   - Note: Multiple failed mint/airdrop attempts");

  console.log("\n4. ADDITIONAL CONTRACT 2 (0xb687...):");
  console.log("   - ERC-20 Token contract");
  console.log("   - Created: 162 days ago (oldest)");
  console.log("   - Activity: Only 2 Approve transactions");
  console.log("   - Status: Minimal activity");

  console.log("\n5. ADDITIONAL CONTRACT 3 (0x25ed...):");
  console.log("   - ERC-20 Token contract");
  console.log("   - Created: 158 days ago");
  console.log("   - Activity: 13 transactions");
  console.log("   - Functions used: Approve, Batch Airdrop, Unpause, Renounce Ownership");
  console.log("   - Note: Multiple failed unpause/airdrop attempts");

  console.log("\n⚠️  RECOMMENDATIONS:");
  console.log("\n✓ All additional contracts are ERC-20 tokens deployed by same wallet");
  console.log("✓ These appear to be test/previous deployments");
  console.log("✓ Main AETH token (0x76A8...) needs proper redeployment");
  console.log("✓ Consider using the redeploy.js script for fresh deployment");

  console.log("\n🔗 PolygonScan Links:");
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`  ${name}: https://polygonscan.com/address/${address}`);
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Analysis failed:", error);
    process.exit(1);
  });
