// add-liquidity.js
// Script to add liquidity to QuickSwap (Polygon) for Aetheron (AETH) and WMATIC
// Usage: node add-liquidity.js

const { ethers } = require("ethers");
require("dotenv").config();

const ROUTER_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // QuickSwap Router
const AETH_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const routerAbi = require("./abis/QuickswapRouter.json");
const erc20Abi = require("./abis/ERC20.json");

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
  const aeth = new ethers.Contract(AETH_ADDRESS, erc20Abi, signer);
  const wmatic = new ethers.Contract(WMATIC_ADDRESS, erc20Abi, signer);

  // Approve tokens
  const amountAETH = ethers.parseUnits("1000", 18); // Adjust as needed
  const amountWMATIC = ethers.parseUnits("10", 18); // Adjust as needed

  await aeth.approve(ROUTER_ADDRESS, amountAETH);
  await wmatic.approve(ROUTER_ADDRESS, amountWMATIC);

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const tx = await router.addLiquidity(
    AETH_ADDRESS,
    WMATIC_ADDRESS,
    amountAETH,
    amountWMATIC,
    0,
    0,
    signer.address,
    deadline
  );
  await tx.wait();
  console.log("Liquidity added to QuickSwap!");
}

main().catch(console.error);
