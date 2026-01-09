const { ethers } = require("ethers");
const fs = require('fs');

async function checkTradingStatus() {
  console.log("\n🚀 Checking Aetheron Trading Status...\n");

  // Use a read-only provider (no private key needed)
  const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');

  // Token address from deployment
  const AETH_TOKEN = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";

  // Load contract ABI
  const AetheronArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8')
  );

  // Create contract instance (read-only)
  const aethToken = new ethers.Contract(AETH_TOKEN, AetheronArtifact.abi, provider);

  try {
    // Check trading status
    const tradingEnabled = await aethToken.tradingEnabled();
    console.log("Trading Status:", tradingEnabled ? "✅ ENABLED" : "❌ DISABLED");

    // Check total supply
    const totalSupply = await aethToken.totalSupply();
    console.log("Total Supply:", ethers.formatEther(totalSupply), "AETH");

    // Check owner
    const owner = await aethToken.owner();
    console.log("Contract Owner:", owner);

    // Check team wallet
    const teamWallet = await aethToken.teamWallet();
    console.log("Team Wallet:", teamWallet);

    // Check marketing wallet
    const marketingWallet = await aethToken.marketingWallet();
    console.log("Marketing Wallet:", marketingWallet);

  } catch (error) {
    console.error("Error checking status:", error.message);
  }
}

checkTradingStatus();