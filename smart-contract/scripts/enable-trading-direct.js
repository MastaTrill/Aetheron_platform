require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  console.log("\n🚀 Enabling Trading for Aetheron Token...\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC || 'https://polygon-rpc.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Using account:", wallet.address);

  // Token address from deployment
  const AETH_TOKEN_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
  console.log("Token address:", AETH_TOKEN_ADDRESS);

  // Load contract artifact
  const AetheronArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8')
  );

  // Get contract instance
  const aetheron = new ethers.Contract(
    AETH_TOKEN_ADDRESS,
    AetheronArtifact.abi,
    wallet
  );

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
    console.log("=".repeat(50));
    console.log("\nUsers can now:");
    console.log("  ✅ Buy and sell AETH tokens");
    console.log("  ✅ Transfer tokens to other wallets");
    console.log("  ✅ Add liquidity to DEX pools");
  } else {
    console.log("❌ ERROR: Trading status unchanged!");
  }
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  });
