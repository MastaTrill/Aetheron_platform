import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const presaleAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const tokenAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    console.log("Funding presale at:", presaleAddress);
    console.log("Token at:", tokenAddress);

    const tokenAbi = [
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address, uint256) returns (bool)",
        "function mint(address, uint256) returns (bool)"
    ];
    const token = new ethers.Contract(tokenAddress, tokenAbi, wallet);

    const deployerBal = await token.balanceOf(wallet.address);
    console.log("Deployer token balance:", ethers.formatEther(deployerBal), "tokens");

    const hardCap = ethers.parseEther("100000000");
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