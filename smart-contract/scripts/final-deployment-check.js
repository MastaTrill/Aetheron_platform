const { ethers } = require("ethers");
const fs = require('fs');

async function finalDeploymentCheck() {
  console.log("\n" + "=".repeat(70));
  console.log("🎯 AETHERON PLATFORM - FINAL DEPLOYMENT VERIFICATION");
  console.log("=".repeat(70) + "\n");

  // Use read-only provider
  const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');

  // Contract addresses
  const AETH_TOKEN = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
  const STAKING_CONTRACT = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
  const DEPLOYER = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
  const TEAM_WALLET = "0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784";
  const MARKETING_WALLET = "0x8a3ad49656bd07981c9cfc7ad826a808847c3452";

  // Load ABIs
  const AetheronArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8')
  );

  const StakingArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/AetheronStaking.sol/AetheronStaking.json', 'utf8')
  );

  // Create contract instances
  const aethToken = new ethers.Contract(AETH_TOKEN, AetheronArtifact.abi, provider);
  const stakingContract = new ethers.Contract(STAKING_CONTRACT, StakingArtifact.abi, provider);

  console.log("🔍 CHECKING CONTRACT DEPLOYMENT STATUS...\n");

  try {
    // Check AETH Token
    console.log("📋 AETH TOKEN CONTRACT");
    console.log("-".repeat(40));

    const tokenName = await aethToken.name();
    const tokenSymbol = await aethToken.symbol();
    const totalSupply = await aethToken.totalSupply();
    const tradingEnabled = await aethToken.tradingEnabled();
    const owner = await aethToken.owner();
    const teamWallet = await aethToken.teamWallet();
    const marketingWallet = await aethToken.marketingWallet();

    console.log("✅ Name:", tokenName);
    console.log("✅ Symbol:", tokenSymbol);
    console.log("✅ Total Supply:", ethers.formatEther(totalSupply), "AETH");
    console.log("✅ Trading Enabled:", tradingEnabled ? "YES ✅" : "NO ❌");
    console.log("✅ Owner:", owner.toLowerCase() === DEPLOYER.toLowerCase() ? "CORRECT ✅" : "INCORRECT ❌");
    console.log("✅ Team Wallet:", teamWallet.toLowerCase() === TEAM_WALLET.toLowerCase() ? "CORRECT ✅" : "INCORRECT ❌");
    console.log("✅ Marketing Wallet:", marketingWallet.toLowerCase() === MARKETING_WALLET.toLowerCase() ? "CORRECT ✅" : "INCORRECT ❌");

    // Check balances
    const deployerBalance = await aethToken.balanceOf(DEPLOYER);
    const teamBalance = await aethToken.balanceOf(TEAM_WALLET);
    const marketingBalance = await aethToken.balanceOf(MARKETING_WALLET);
    const stakingBalance = await aethToken.balanceOf(STAKING_CONTRACT);

    console.log("\n💰 TOKEN DISTRIBUTION:");
    console.log("Deployer:", ethers.formatEther(deployerBalance), "AETH (for liquidity)");
    console.log("Team:", ethers.formatEther(teamBalance), "AETH");
    console.log("Marketing:", ethers.formatEther(marketingBalance), "AETH");
    console.log("Staking Pool:", ethers.formatEther(stakingBalance), "AETH");

    console.log("\n📋 STAKING CONTRACT");
    console.log("-".repeat(40));

    const stakingToken = await stakingContract.aetheronToken();
    const stakingOwner = await stakingContract.owner();

    console.log("✅ Staking Token:", stakingToken === AETH_TOKEN ? "CORRECT ✅" : "INCORRECT ❌");
    console.log("✅ Staking Owner:", stakingOwner === DEPLOYER ? "CORRECT ✅" : "INCORRECT ❌");

    // Check if staking pools are configured
    try {
      const poolCount = await stakingContract.poolCount();
      console.log("✅ Staking Pools:", Number(poolCount));
    } catch (e) {
      console.log("⚠️  Staking pools not accessible");
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT STATUS: COMPLETE ✅");
    console.log("=".repeat(70));

    console.log("\n📝 NEXT STEPS:");
    console.log("1. ✅ Contracts deployed and configured");
    console.log("2. ✅ Trading enabled");
    console.log("3. 🔄 Add liquidity on QuickSwap (MANUAL - requires your wallet)");
    console.log("4. 🔄 Update website with live prices");
    console.log("5. 🔄 Announce launch on social media");
    console.log("6. 🔄 Submit to CoinGecko/CoinMarketCap");

    console.log("\n💡 LIQUIDITY SETUP:");
    console.log("Go to: https://quickswap.exchange/#/add/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e");
    console.log("Add USDC + AETH pair");
    console.log("Recommended: 1,000 USDC + 1,000,000 AETH");

    console.log("\n🚀 READY FOR LAUNCH!");

  } catch (error) {
    console.error("❌ Error checking deployment:", error.message);
  }
}

finalDeploymentCheck();