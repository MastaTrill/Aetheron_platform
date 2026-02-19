// fund-wallets.mjs
// Script to send POL or Aetheron tokens to team and marketing wallets
// Usage: node fund-wallets.mjs

import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();
import { validateOrExit, checkBalance, colors } from "./utils/validateEnv.mjs";

async function main() {
  console.log("\n" + colors.bold + colors.cyan + "💸 Aetheron Wallet Funding Script" + colors.reset);
  console.log("=".repeat(60) + "\n");

  // Validate environment variables
  console.log(colors.bold + "🔍 Validating configuration..." + colors.reset);
  validateOrExit({ requireTokenAddress: true, requireWallets: true });
  console.log(colors.green + "✅ Configuration validated successfully!\n" + colors.reset);

  // Get configuration from environment
  const TEAM_WALLET = process.env.TEAM_WALLET;
  const MARKETING_WALLET = process.env.MARKETING_WALLET;
  const AETHERON_ADDRESS = process.env.AETH_TOKEN_ADDRESS;
  const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(colors.bold + "📋 Configuration:" + colors.reset);
  console.log("  Sender:", colors.cyan + signer.address + colors.reset);
  console.log("  Team Wallet:", colors.cyan + TEAM_WALLET + colors.reset);
  console.log("  Marketing Wallet:", colors.cyan + MARKETING_WALLET + colors.reset);
  console.log("  AETH Token:", colors.cyan + AETHERON_ADDRESS + colors.reset);
  console.log("");

  try {
    // Check sender balance
    const senderBalance = await provider.getBalance(signer.address);
    const senderBalanceEth = ethers.formatEther(senderBalance);
    console.log(colors.bold + "💰 Sender Balance:" + colors.reset, colors.cyan + senderBalanceEth + " POL" + colors.reset);

    if (senderBalance === 0n) {
      console.error("\n" + colors.red + "❌ ERROR: Sender wallet has no POL!" + colors.reset);
      console.log(colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Add POL to your wallet: " + signer.address);
      process.exit(1);
    }

    // Load AETH token contract
    const aetheronAbi = JSON.parse(fs.readFileSync("./artifacts/contracts/Aetheron.sol/Aetheron.json", "utf8")).abi;
    const token = new ethers.Contract(AETHERON_ADDRESS, aetheronAbi, signer);

    // Check AETH balance
    const aetheronBalance = await token.balanceOf(signer.address);
    const aetheronBalanceFormatted = ethers.formatUnits(aetheronBalance, 18);
    console.log(colors.bold + "🪙  Sender AETH Balance:" + colors.reset, colors.cyan + aetheronBalanceFormatted + " AETH" + colors.reset);
    console.log("");

    // Fund configuration
    const POL_AMOUNT = "1"; // 1 POL per wallet
    const AETH_AMOUNT = "1000"; // 1000 AETH per wallet
    const WALLET_COUNT = 2; // Number of wallets to fund

    const polAmountWei = ethers.parseEther(POL_AMOUNT);
    const aetheronAmountWei = ethers.parseUnits(AETH_AMOUNT, 18);

    // Check if sender has enough POL
    const totalPolNeeded = polAmountWei * BigInt(WALLET_COUNT);
    if (senderBalance < totalPolNeeded) {
      console.error(colors.red + "❌ ERROR: Insufficient POL balance!" + colors.reset);
      console.error(colors.red + `   Available: ${senderBalanceEth} POL` + colors.reset);
      console.error(colors.red + `   Needed: ${ethers.formatEther(totalPolNeeded)} POL (for ${WALLET_COUNT} wallets)` + colors.reset);
      process.exit(1);
    }

    // Check if sender has enough AETH
    const totalAethNeeded = aetheronAmountWei * BigInt(WALLET_COUNT);
    if (aetheronBalance < totalAethNeeded) {
      console.error(colors.red + "❌ ERROR: Insufficient AETH balance!" + colors.reset);
      console.error(colors.red + `   Available: ${aetheronBalanceFormatted} AETH` + colors.reset);
      console.error(colors.red + `   Needed: ${String(Number(AETH_AMOUNT) * WALLET_COUNT)} AETH (for ${WALLET_COUNT} wallets)` + colors.reset);
      process.exit(1);
    }

    console.log(colors.bold + "📤 Starting transfers..." + colors.reset);
    console.log("");

    // Send POL to Team Wallet
    console.log(colors.bold + `1. Sending ${POL_AMOUNT} POL to Team Wallet...` + colors.reset);
    const polToTeamTx = await signer.sendTransaction({
      to: TEAM_WALLET,
      value: polAmountWei
    });
    await polToTeamTx.wait();
    console.log(colors.green + `   ✅ Sent ${POL_AMOUNT} POL to ${TEAM_WALLET}` + colors.reset);
    console.log(colors.cyan + `   Tx: ${polToTeamTx.hash}` + colors.reset);
    console.log("");

    // Send POL to Marketing Wallet
    console.log(colors.bold + `2. Sending ${POL_AMOUNT} POL to Marketing Wallet...` + colors.reset);
    const polToMarketingTx = await signer.sendTransaction({
      to: MARKETING_WALLET,
      value: polAmountWei
    });
    await polToMarketingTx.wait();
    console.log(colors.green + `   ✅ Sent ${POL_AMOUNT} POL to ${MARKETING_WALLET}` + colors.reset);
    console.log(colors.cyan + `   Tx: ${polToMarketingTx.hash}` + colors.reset);
    console.log("");

    // Send AETH to Team Wallet
    console.log(colors.bold + `3. Sending ${AETH_AMOUNT} AETH to Team Wallet...` + colors.reset);
    const aetheronToTeamTx = await token.transfer(TEAM_WALLET, aetheronAmountWei);
    await aetheronToTeamTx.wait();
    console.log(colors.green + `   ✅ Sent ${AETH_AMOUNT} AETH to ${TEAM_WALLET}` + colors.reset);
    console.log(colors.cyan + `   Tx: ${aetheronToTeamTx.hash}` + colors.reset);
    console.log("");

    // Send AETH to Marketing Wallet
    console.log(colors.bold + `4. Sending ${AETH_AMOUNT} AETH to Marketing Wallet...` + colors.reset);
    const aetheronToMarketingTx = await token.transfer(MARKETING_WALLET, aetheronAmountWei);
    await aetheronToMarketingTx.wait();
    console.log(colors.green + `   ✅ Sent ${AETH_AMOUNT} AETH to ${MARKETING_WALLET}` + colors.reset);
    console.log(colors.cyan + `   Tx: ${aetheronToMarketingTx.hash}` + colors.reset);
    console.log("");

    // Summary
    console.log("=".repeat(60));
    console.log(colors.bold + colors.green + "🎉 ALL TRANSFERS COMPLETE!" + colors.reset);
    console.log("=".repeat(60));
    console.log("");
    console.log(colors.bold + "📊 Summary:" + colors.reset);
    console.log(`  ✅ Team Wallet received: ${POL_AMOUNT} POL + ${AETH_AMOUNT} AETH`);
    console.log(`  ✅ Marketing Wallet received: ${POL_AMOUNT} POL + ${AETH_AMOUNT} AETH`);
    console.log("");

  } catch (error) {
    console.error("\n" + colors.red + "❌ TRANSFER FAILED!" + colors.reset);
    console.error(colors.red + error.message + colors.reset);

    if (error.message.includes("insufficient funds")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Add more POL or AETH to your sender wallet");
    } else if (error.message.includes("nonce")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Wait a few seconds and try again");
    } else if (error.message.includes("transfer amount exceeds balance")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Reduce the transfer amounts or add more tokens to sender wallet");
    }

    throw error;
  }
}

main()
  .then(() => {
    console.log("");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n" + colors.red + "Script failed:" + colors.reset);
    console.error(error);
    process.exit(1);
  });
