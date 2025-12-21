require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function main() {
  console.log("\n📝 POLYGONSCAN CONTRACT VERIFICATION");
  console.log("=".repeat(60) + "\n");

  const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
  
  if (!POLYGONSCAN_API_KEY) {
    console.log("⚠️  POLYGONSCAN_API_KEY not found in .env");
    console.log("   Get your API key from: https://polygonscan.com/myapikey");
    console.log("   Add to .env: POLYGONSCAN_API_KEY=your_key_here\n");
  }

  const TEAM_WALLET = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
  const MARKETING_WALLET = "0x8a3ad49656bd07981c9cfc7ad826a808847c3452";
  const DEPLOYER = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";

  const AETH_TOKEN = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
  const STAKING = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";

  console.log("📋 Contracts to Verify:\n");
  console.log("1. AETH Token:", AETH_TOKEN);
  console.log("   Constructor Args:", TEAM_WALLET, MARKETING_WALLET, DEPLOYER);
  console.log("\n2. Staking Contract:", STAKING);
  console.log("   Constructor Args:", AETH_TOKEN);
  console.log("\n" + "=".repeat(60));

  if (!POLYGONSCAN_API_KEY) {
    console.log("\n💡 Manual Verification Steps:\n");
    console.log("1. Go to PolygonScan:");
    console.log("   https://polygonscan.com/address/" + AETH_TOKEN + "#code\n");
    console.log("2. Click 'Verify and Publish'\n");
    console.log("3. Enter these details:");
    console.log("   - Compiler: v0.8.20");
    console.log("   - Optimization: Yes (200 runs)");
    console.log("   - License: MIT\n");
    console.log("4. Upload Aetheron.sol and constructor arguments\n");
    console.log("5. Repeat for Staking Contract:");
    console.log("   https://polygonscan.com/address/" + STAKING + "#code\n");
    return;
  }

  console.log("\n🚀 Starting Automated Verification...\n");

  try {
    // Verify AETH Token
    console.log("1️⃣  Verifying AETH Token...");
    const aetheronCmd = `npx hardhat verify --network polygon ${AETH_TOKEN} "${TEAM_WALLET}" "${MARKETING_WALLET}" "${DEPLOYER}"`;
    console.log("   Command:", aetheronCmd);
    
    try {
      const { stdout, stderr } = await execPromise(aetheronCmd);
      console.log(stdout);
      if (stderr) console.log(stderr);
      console.log("   ✅ AETH Token verified!\n");
    } catch (error) {
      if (error.message.includes('Already Verified')) {
        console.log("   ℹ️  Already verified\n");
      } else {
        console.log("   ❌ Verification failed:", error.message);
      }
    }

    // Verify Staking Contract
    console.log("2️⃣  Verifying Staking Contract...");
    const stakingCmd = `npx hardhat verify --network polygon ${STAKING} "${AETH_TOKEN}"`;
    console.log("   Command:", stakingCmd);
    
    try {
      const { stdout, stderr } = await execPromise(stakingCmd);
      console.log(stdout);
      if (stderr) console.log(stderr);
      console.log("   ✅ Staking Contract verified!\n");
    } catch (error) {
      if (error.message.includes('Already Verified')) {
        console.log("   ℹ️  Already verified\n");
      } else {
        console.log("   ❌ Verification failed:", error.message);
      }
    }

    console.log("=".repeat(60));
    console.log("✅ VERIFICATION COMPLETE!\n");
    console.log("View verified contracts:");
    console.log("  AETH Token: https://polygonscan.com/address/" + AETH_TOKEN + "#code");
    console.log("  Staking: https://polygonscan.com/address/" + STAKING + "#code\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
