const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("\n🚀 Enabling Trading for Aetheron Token...\n");

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Token address - UPDATE THIS with your deployed token address
  const AETH_TOKEN_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "YOUR_TOKEN_ADDRESS_HERE";
  
  if (AETH_TOKEN_ADDRESS === "YOUR_TOKEN_ADDRESS_HERE") {
    console.error("❌ ERROR: Please set AETH_TOKEN_ADDRESS in your .env file");
    console.log("   Add this line to .env:");
    console.log("   AETH_TOKEN_ADDRESS=0xYourTokenAddress");
    process.exit(1);
  }

  console.log("Token address:", AETH_TOKEN_ADDRESS);

  // Get contract instance
  const Aetheron = await ethers.getContractFactory("Aetheron");
  const aetheron = Aetheron.attach(AETH_TOKEN_ADDRESS);

  // Check current trading status
  const tradingEnabled = await aetheron.tradingEnabled();
  console.log("Current trading status:", tradingEnabled ? "ENABLED ✅" : "DISABLED ❌");

  if (tradingEnabled) {
    console.log("\n✅ Trading is already enabled!");
    return;
  }

  // Enable trading
  console.log("\n⏳ Enabling trading...");
  const tx = await aetheron.enableTrading();
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  
  // Verify
  const newStatus = await aetheron.tradingEnabled();
  
  console.log("\n" + "=".repeat(50));
  if (newStatus) {
    console.log("🎉 SUCCESS! Trading is now ENABLED!");
  } else {
    console.log("❌ FAILED! Trading is still disabled.");
  }
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
