// add-liquidity.js
// Script to add liquidity to QuickSwap (Polygon) for Aetheron (AETH) and USDC
// Usage: node add-liquidity.js

const ethers = require("ethers");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();

const ROUTER_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // QuickSwap Router
const AETH_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const USDC_ADDRESS = "0xDF5A2b892254C42F80000A029dfE8b311f777Bd5"; // Updated token for liquidity
const routerAbi = JSON.parse(fs.readFileSync("./abis/QuickswapRouter.json", "utf8"));
const erc20Abi = JSON.parse(fs.readFileSync("./abis/ERC20.json", "utf8"));

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
  const aeth = new ethers.Contract(AETH_ADDRESS, erc20Abi, signer);
  const usdc = new ethers.Contract(USDC_ADDRESS, erc20Abi, signer);

  // Check balances first
  const aethBalance = await aeth.balanceOf(signer.address);
  const usdcBalance = await usdc.balanceOf(signer.address);
  const maticBalance = await provider.getBalance(signer.address);

  console.log(`Wallet: ${signer.address}`);
  console.log(`AETH Balance: ${ethers.formatUnits(aethBalance, 18)} AETH`);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 18)} tokens`);
  console.log(`MATIC Balance: ${ethers.formatEther(maticBalance)} MATIC`);

  // Adjust amounts based on what you want to add
  const amountAETH = ethers.parseUnits("1000000", 18); // 1M AETH - adjust as needed
  const amountUSDC = ethers.parseUnits("1000", 18); // 1000 tokens - adjust as needed (18 decimals)

  console.log(`\nAdding liquidity:`);
  console.log(`AETH: ${ethers.formatUnits(amountAETH, 18)} AETH`);
  console.log(`USDC: ${ethers.formatUnits(amountUSDC, 18)} tokens`);

  // Check if balances are sufficient
  if (aethBalance < amountAETH) {
    throw new Error(`Insufficient AETH balance. Have: ${ethers.formatUnits(aethBalance, 18)}, Need: ${ethers.formatUnits(amountAETH, 18)}`);
  }
  if (usdcBalance < amountUSDC) {
    throw new Error(`Insufficient USDC balance. Have: ${ethers.formatUnits(usdcBalance, 18)}, Need: ${ethers.formatUnits(amountUSDC, 18)}`);
  }

  console.log("\nApproving AETH token...");
  const approveAETH = await aeth.approve(ROUTER_ADDRESS, amountAETH);
  await approveAETH.wait();
  console.log("✅ AETH approved");

  console.log("Approving USDC token...");
  const approveUSDC = await usdc.approve(ROUTER_ADDRESS, amountUSDC);
  await approveUSDC.wait();
  console.log("✅ USDC approved");

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  console.log("\n🚀 Adding liquidity to QuickSwap...");
  const tx = await router.addLiquidity(
    AETH_ADDRESS,
    USDC_ADDRESS,
    amountAETH,
    amountUSDC,
    0, // amountAMin
    0, // amountBMin
    signer.address,
    deadline,
    {
      gasLimit: 500000,
      gasPrice: ethers.parseUnits('50', 'gwei')
    }
  );

  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  console.log("✅ Liquidity added successfully!");
  console.log("View on PolygonScan:", `https://polygonscan.com/tx/${tx.hash}`);
}

main().catch(console.error);
