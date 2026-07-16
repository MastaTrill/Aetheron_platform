import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "./smart-contract/.env", override: true });

const RPC_URL = process.env.ETHEREUM_RPC_URL || "https://base.drpc.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const presaleAddress = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
const tokenAddress = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";

const tokenAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)"
];

async function main() {
    if (!PRIVATE_KEY) {
        console.error("PRIVATE_KEY environment variable is required");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Funding presale at:", presaleAddress);
    console.log("Token at:", tokenAddress);
    console.log("Deploying from:", wallet.address);

    const token = new ethers.Contract(tokenAddress, tokenAbi, wallet);

    const deployerBal = await token.balanceOf(wallet.address);
    console.log("Deployer token balance:", ethers.formatEther(deployerBal), "tokens");

    const hardCap = ethers.parseEther("50000000");
    console.log("Funding presale with:", ethers.formatEther(hardCap), "tokens");

    const tx = await token.transfer(presaleAddress, hardCap);
    await tx.wait();
    console.log("✅ Presale funded");

    const presaleBal = await token.balanceOf(presaleAddress);
    console.log("Presale token balance:", ethers.formatEther(presaleBal), "tokens");
}

main().catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
});