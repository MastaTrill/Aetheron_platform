// add-liquidity.js
// Script to add liquidity to QuickSwap (Polygon) for Aetheron (AETH) and WMATIC
// Usage: node add-liquidity.js

const { ethers } = require("ethers");
require("dotenv").config();

const ROUTER_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // QuickSwap Router
const AETH_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "0x44F9c15816bCe5d6691448F60DAD50355ABa40b5";
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
  const amountAETH = ethers.parseUnits("100", 18); // Adjust as needed
  const amountWMATIC = ethers.parseUnits("0.1", 18); // Adjust as needed

  console.log("Approving AETH token...");
  const approveAETH = await aeth.approve(ROUTER_ADDRESS, amountAETH);
  await approveAETH.wait();
  console.log("AETH approved");

  console.log("Approving WMATIC token...");
  const approveWMATIC = await wmatic.approve(ROUTER_ADDRESS, amountWMATIC);
  await approveWMATIC.wait();
  console.log("WMATIC approved");

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  console.log("Adding liquidity to QuickSwap...");
  const tx = await router.addLiquidity(
    AETH_ADDRESS,
    WMATIC_ADDRESS,
    amountAETH,
    amountWMATIC,
    0,
    0,
    signer.address,
    deadline,
    {
      gasLimit: 300000,
      gasPrice: ethers.parseUnits('50', 'gwei')
    }
  );
  await tx.wait();
  console.log("Liquidity added successfully!");
  console.log("Transaction hash:", tx.hash);
}

main().catch(console.error);
