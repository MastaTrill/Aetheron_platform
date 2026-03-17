import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
dotenv.config();
import { validateOrExit, colors } from "../utils/validateEnv.mjs";

async function main() {
  console.log("\n" + colors.bold + colors.cyan + "🚀 Enabling Trading for Aetheron Token..." + colors.reset);
  console.log("=".repeat(60) + "\n");

  // Validate environment variables before proceeding
  console.log(colors.bold + "🔍 Validating configuration..." + colors.reset);
  validateOrExit({ requireTokenAddress: true, requireWallets: false });
  console.log(colors.green + "✅ Configuration validated successfully!\n" + colors.reset);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", colors.cyan + signer.address + colors.reset);

  // Token address from environment
  const AETH_TOKEN_ADDRESS = process.env.AETH_TOKEN_ADDRESS;
  console.log("Token address:", colors.cyan + AETH_TOKEN_ADDRESS + colors.reset);

  try {
    // Get contract instance
    const Aetheron = await ethers.getContractFactory("Aetheron");
    const aetheron = Aetheron.attach(AETH_TOKEN_ADDRESS);

    // Check current trading status
    console.log("\n" + colors.bold + "📊 Checking current status..." + colors.reset);
    const tradingEnabled = await aetheron.tradingEnabled();
    console.log("Current trading status:", tradingEnabled ? colors.green + "ENABLED ✅" + colors.reset : colors.yellow + "DISABLED ❌" + colors.reset);

    if (tradingEnabled) {
      console.log("\n" + colors.green + "✅ Trading is already enabled!" + colors.reset);
      console.log(colors.cyan + "\n💡 Next steps:" + colors.reset);
      console.log("   1. Add liquidity to DEX");
      console.log("   2. Announce token launch");
      console.log("   3. Update frontend with live prices\n");
      return;
    }

    // Enable trading
    console.log("\n" + colors.bold + "⏳ Enabling trading..." + colors.reset);
    const tx = await aetheron.enableTrading();
    console.log("Transaction hash:", colors.cyan + tx.hash + colors.reset);

    console.log("⏳ Waiting for confirmation...");
    await tx.wait();

    // Verify
    const newStatus = await aetheron.tradingEnabled();

    console.log("\n" + "=".repeat(50));
    if (newStatus) {
      console.log(colors.bold + colors.green + "🎉 SUCCESS! Trading is now ENABLED!" + colors.reset);
      console.log("=".repeat(50) + "\n");

      console.log(colors.cyan + "📖 Next steps:" + colors.reset);
      console.log("   1. Add liquidity to DEX (QuickSwap/Uniswap)");
      console.log("   2. Users can now buy and sell AETH tokens");
      console.log("   3. Monitor trading activity");
      console.log("   4. Announce launch on social media\n");
    } else {
      console.log(colors.bold + colors.red + "❌ FAILED! Trading is still disabled." + colors.reset);
      console.log("=".repeat(50) + "\n");

      console.log(colors.yellow + "💡 Possible reasons:" + colors.reset);
      console.log("   1. You are not the contract owner");
      console.log("   2. Trading was already enabled (check contract)");
      console.log("   3. Transaction reverted\n");
    }
  } catch (error) {
    console.error("\n" + colors.red + "❌ ERROR: " + error.message + colors.reset);

    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Only the contract owner can enable trading.");
      console.log("   Make sure you're using the deployer's private key in .env");
    } else if (error.message.includes("cannot estimate gas")) {
      console.log("\n" + colors.yellow + "💡 Diagnosis steps:" + colors.reset);
      console.log("   1. Check if trading is already enabled:");
      console.log("      Run: node scripts/check-trading-status.js");
      console.log("   2. Verify contract address is correct:");
      console.log("      Visit: https://polygonscan.com/address/" + AETH_TOKEN_ADDRESS);
      console.log("   3. If contract doesn't exist, update AETH_TOKEN_ADDRESS in .env");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Add more POL to your wallet for gas fees.");
    }

    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n" + colors.red + "Script failed with error:" + colors.reset);
    console.error(error);
    process.exit(1);
  });
