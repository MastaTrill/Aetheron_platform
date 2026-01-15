// add-liquidity.js
// Script to add liquidity to QuickSwap (Polygon) for Aetheron (AETH) and WMATIC
// Usage: node add-liquidity.js

const { ethers } = require("ethers");
require("dotenv").config();
const { validateOrExit, checkBalance, colors } = require("./utils/validateEnv");

// QuickSwap Router on Polygon
const ROUTER_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

// Minimal ABIs (only functions we need)
const routerAbi = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
];

const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

async function main() {
  console.log("\n" + colors.bold + colors.cyan + "💧 Aetheron Liquidity Addition Script" + colors.reset);
  console.log("=".repeat(60) + "\n");

  // Validate environment variables
  console.log(colors.bold + "🔍 Validating configuration..." + colors.reset);
  validateOrExit({ requireTokenAddress: true, requireWallets: false });
  console.log(colors.green + "✅ Configuration validated successfully!\n" + colors.reset);

  const AETH_ADDRESS = process.env.AETH_TOKEN_ADDRESS;
  const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(colors.bold + "📋 Configuration:" + colors.reset);
  console.log("  Liquidity Provider:", colors.cyan + signer.address + colors.reset);
  console.log("  AETH Token:", colors.cyan + AETH_ADDRESS + colors.reset);
  console.log("  WMATIC Token:", colors.cyan + WMATIC_ADDRESS + colors.reset);
  console.log("  QuickSwap Router:", colors.cyan + ROUTER_ADDRESS + colors.reset);
  console.log("");

  try {
    // Initialize contracts
    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
    const aeth = new ethers.Contract(AETH_ADDRESS, erc20Abi, signer);
    const wmatic = new ethers.Contract(WMATIC_ADDRESS, erc20Abi, signer);

    // Check balances
    console.log(colors.bold + "💰 Checking balances..." + colors.reset);
    
    const polBalance = await provider.getBalance(signer.address);
    const polBalanceEth = ethers.formatEther(polBalance);
    console.log("  POL Balance:", colors.cyan + polBalanceEth + " POL" + colors.reset);

    const aetheronBalance = await aeth.balanceOf(signer.address);
    const aetheronBalanceFormatted = ethers.formatUnits(aetheronBalance, 18);
    console.log("  AETH Balance:", colors.cyan + aetheronBalanceFormatted + " AETH" + colors.reset);

    const wmaticBalance = await wmatic.balanceOf(signer.address);
    const wmaticBalanceFormatted = ethers.formatUnits(wmaticBalance, 18);
    console.log("  WMATIC Balance:", colors.cyan + wmaticBalanceFormatted + " WMATIC" + colors.reset);
    console.log("");

    // Liquidity amounts (adjust these as needed)
    const amountAETH = ethers.parseUnits("1000", 18); // 1000 AETH
    const amountWMATIC = ethers.parseUnits("10", 18); // 10 WMATIC

    console.log(colors.bold + "💧 Liquidity to add:" + colors.reset);
    console.log("  AETH:", colors.cyan + ethers.formatUnits(amountAETH, 18) + " AETH" + colors.reset);
    console.log("  WMATIC:", colors.cyan + ethers.formatUnits(amountWMATIC, 18) + " WMATIC" + colors.reset);
    console.log("");

    // Check if user has enough tokens
    if (aetheronBalance < amountAETH) {
      console.error(colors.red + "❌ ERROR: Insufficient AETH balance!" + colors.reset);
      console.error(colors.red + `   Available: ${aetheronBalanceFormatted} AETH` + colors.reset);
      console.error(colors.red + `   Needed: ${ethers.formatUnits(amountAETH, 18)} AETH` + colors.reset);
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   1. Reduce the AETH amount in the script");
      console.log("   2. Or ensure you have enough AETH in your wallet");
      process.exit(1);
    }

    if (wmaticBalance < amountWMATIC) {
      console.error(colors.red + "❌ ERROR: Insufficient WMATIC balance!" + colors.reset);
      console.error(colors.red + `   Available: ${wmaticBalanceFormatted} WMATIC` + colors.reset);
      console.error(colors.red + `   Needed: ${ethers.formatUnits(amountWMATIC, 18)} WMATIC` + colors.reset);
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   1. Wrap POL to WMATIC first");
      console.log("   2. Or reduce the WMATIC amount in the script");
      console.log("   3. Visit https://quickswap.exchange to wrap POL");
      process.exit(1);
    }

    // Approve tokens
    console.log(colors.bold + "📝 Approving tokens..." + colors.reset);
    
    console.log("  Approving AETH...");
    const approveAethTx = await aeth.approve(ROUTER_ADDRESS, amountAETH);
    await approveAethTx.wait();
    console.log(colors.green + "  ✅ AETH approved" + colors.reset);

    console.log("  Approving WMATIC...");
    const approveWmaticTx = await wmatic.approve(ROUTER_ADDRESS, amountWMATIC);
    await approveWmaticTx.wait();
    console.log(colors.green + "  ✅ WMATIC approved" + colors.reset);
    console.log("");

    // Add liquidity
    console.log(colors.bold + "💧 Adding liquidity to QuickSwap..." + colors.reset);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    
    const addLiquidityTx = await router.addLiquidity(
      AETH_ADDRESS,
      WMATIC_ADDRESS,
      amountAETH,
      amountWMATIC,
      0, // Accept any amount of AETH
      0, // Accept any amount of WMATIC
      signer.address,
      deadline
    );
    
    console.log("  Transaction hash:", colors.cyan + addLiquidityTx.hash + colors.reset);
    console.log("  ⏳ Waiting for confirmation...");
    
    const receipt = await addLiquidityTx.wait();
    console.log(colors.green + "  ✅ Liquidity added successfully!" + colors.reset);
    console.log("");

    // Summary
    console.log("=".repeat(60));
    console.log(colors.bold + colors.green + "🎉 LIQUIDITY ADDITION COMPLETE!" + colors.reset);
    console.log("=".repeat(60));
    console.log("");
    console.log(colors.bold + "📊 Summary:" + colors.reset);
    console.log("  ✅ Added", ethers.formatUnits(amountAETH, 18), "AETH");
    console.log("  ✅ Added", ethers.formatUnits(amountWMATIC, 18), "WMATIC");
    console.log("  ✅ Transaction:", colors.cyan + addLiquidityTx.hash + colors.reset);
    console.log("");
    console.log(colors.cyan + "🔗 View on QuickSwap:" + colors.reset);
    console.log("  https://quickswap.exchange/#/pool");
    console.log("");
    console.log(colors.cyan + "📖 Next steps:" + colors.reset);
    console.log("  1. Trading is now live on QuickSwap");
    console.log("  2. Share the swap link with your community");
    console.log("  3. Monitor liquidity and trading volume");
    console.log("  4. Consider adding more liquidity as trading increases");
    console.log("");

  } catch (error) {
    console.error("\n" + colors.red + "❌ LIQUIDITY ADDITION FAILED!" + colors.reset);
    console.error(colors.red + error.message + colors.reset);

    if (error.message.includes("insufficient funds")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Add more POL to your wallet for gas fees");
    } else if (error.message.includes("insufficient allowance")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Token approval failed. Try running the script again.");
    } else if (error.message.includes("INSUFFICIENT_A_AMOUNT") || error.message.includes("INSUFFICIENT_B_AMOUNT")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   The amounts are not balanced. Adjust the token amounts in the script.");
    } else if (error.message.includes("EXPIRED")) {
      console.log("\n" + colors.yellow + "💡 Solution:" + colors.reset);
      console.log("   Transaction took too long. Try again with a longer deadline.");
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
