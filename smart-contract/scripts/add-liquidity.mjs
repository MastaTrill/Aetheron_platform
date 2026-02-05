import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import fs from 'fs';

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("💧 AETHERON - ADD LIQUIDITY TO QUICKSWAP");
  console.log("=".repeat(60) + "\n");

  // Setup
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC || 'https://polygon-rpc.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📍 Wallet:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 POL Balance:", ethers.formatEther(balance), "POL");

  // Contract addresses
  const AETH_TOKEN = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
  const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // QuickSwap V2 Router
  const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // Wrapped POL

  // Load token ABI
  const AetheronArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8')
  );

  // QuickSwap Router ABI (minimal - only functions we need)
  const ROUTER_ABI = [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)"
  ];

  const aethToken = new ethers.Contract(AETH_TOKEN, AetheronArtifact.abi, wallet);
  const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, wallet);

  // Check AETH balance
  const aetheronBalance = await aethToken.balanceOf(wallet.address);
  console.log("🪙 AETH Balance:", ethers.formatEther(aetheronBalance), "AETH\n");

  if (aetheronBalance === 0n) {
    console.error("❌ No AETH tokens in wallet!");
    process.exit(1);
  }

  // Configuration - ADJUST THESE VALUES
  const AETH_AMOUNT = ethers.parseEther("10000000"); // 10M AETH
  const POL_AMOUNT = ethers.parseEther("5"); // 5 POL

  console.log("📋 Liquidity Configuration:");
  console.log("  AETH Amount:", ethers.formatEther(AETH_AMOUNT), "AETH");
  console.log("  POL Amount:", ethers.formatEther(POL_AMOUNT), "POL");

  // Calculate initial price
  const pricePerAETH = Number(ethers.formatEther(POL_AMOUNT)) / Number(ethers.formatEther(AETH_AMOUNT));
  console.log("  Initial Price:", pricePerAETH.toFixed(10), "POL per AETH");
  console.log("  Market Cap (at this price):", (pricePerAETH * 1000000000).toFixed(2), "POL\n");

  // Validation
  if (aetheronBalance < AETH_AMOUNT) {
    console.error("❌ Insufficient AETH balance!");
    console.log("   Need:", ethers.formatEther(AETH_AMOUNT), "AETH");
    console.log("   Have:", ethers.formatEther(aetheronBalance), "AETH");
    process.exit(1);
  }

  if (balance < POL_AMOUNT) {
    console.error("❌ Insufficient POL balance!");
    console.log("   Need:", ethers.formatEther(POL_AMOUNT), "POL");
    console.log("   Have:", ethers.formatEther(balance), "POL");
    process.exit(1);
  }

  console.log("⚠️  IMPORTANT: Review the amounts above before proceeding!");
  console.log("   This will lock your tokens in the liquidity pool.");
  console.log("   You can remove liquidity later, but it may affect token price.\n");

  console.log("━".repeat(60));
  console.log("STEP 1: Approve Router to Spend AETH");
  console.log("━".repeat(60));

  const approveTx = await aethToken.approve(QUICKSWAP_ROUTER, AETH_AMOUNT);
  console.log("📤 Approval transaction:", approveTx.hash);
  await approveTx.wait();
  console.log("✅ Router approved to spend AETH\n");

  console.log("━".repeat(60));
  console.log("STEP 2: Add Liquidity to QuickSwap");
  console.log("━".repeat(60));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const slippage = 5; // 5% slippage tolerance
  const minAETH = AETH_AMOUNT * BigInt(100 - slippage) / 100n;
  const minPOL = POL_AMOUNT * BigInt(100 - slippage) / 100n;

  console.log("📤 Adding liquidity...");
  console.log("   Slippage tolerance:", slippage + "%");
  console.log("   Deadline:", new Date(deadline * 1000).toLocaleTimeString());

  const addLiquidityTx = await router.addLiquidityETH(
    AETH_TOKEN,
    AETH_AMOUNT,
    minAETH,
    minPOL,
    wallet.address,
    deadline,
    { value: POL_AMOUNT }
  );

  console.log("   Transaction hash:", addLiquidityTx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await addLiquidityTx.wait();
  console.log("✅ Liquidity added successfully!\n");

  console.log("=".repeat(60));
  console.log("🎉 LIQUIDITY POOL CREATED!");
  console.log("=".repeat(60));

  console.log("\n📊 Pool Information:");
  console.log("  DEX: QuickSwap V2");
  console.log("  Pair: AETH/POL");
  console.log("  View on QuickSwap: https://quickswap.exchange/#/pool");
  console.log("  Add more: https://quickswap.exchange/#/add/ETH/" + AETH_TOKEN);

  console.log("\n💡 Next Steps:");
  console.log("  1. View your LP tokens in MetaMask");
  console.log("  2. Share trading link with community");
  console.log("  3. Trading link: https://quickswap.exchange/#/swap?outputCurrency=" + AETH_TOKEN);
  console.log("  4. Monitor pool on QuickSwap Analytics\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
