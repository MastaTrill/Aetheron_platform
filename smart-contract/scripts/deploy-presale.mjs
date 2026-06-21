import { ethers } from "ethers";
import { readFileSync } from "fs";

const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon.drpc.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY environment variable is required");
    process.exit(1);
}

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Deploying from address:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "MATIC");

    const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));

    const AETH_TOKEN_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
    const RATE = 1000;
    const SOFT_CAP = ethers.parseEther("5000");
    const MAX_WEI_RAISED = ethers.parseEther("33333.333333333333333333");
    const startTime = Math.floor(Date.now() / 1000) + 3600;
    const endTime = startTime + 14 * 24 * 3600;
    const minContribution = ethers.parseEther("0.1");
    const maxContribution = ethers.parseEther("1000");

    const presaleFactory = new ethers.ContractFactory(presaleArtifact.abi, presaleArtifact.bytecode, wallet);
    console.log("Deploying AetheronPresaleV2...");
    const presale = await presaleFactory.deploy(
        AETH_TOKEN_ADDRESS,
        RATE,
        SOFT_CAP,
        MAX_WEI_RAISED,
        minContribution,
        maxContribution,
        startTime,
        endTime
    );
    await presale.waitForDeployment();
    const address = await presale.getAddress();

    console.log("------------------------------------------");
    console.log("✅ Presale Deployed to:", address);
    console.log("------------------------------------------");
    console.log("Start Time:", new Date(startTime * 1000).toISOString());
    console.log("End Time:", new Date(endTime * 1000).toISOString());

    console.log("⚙️  Excluding Presale Contract from Tax...");
    try {
        const tokenAbi = ["function setExcludedFromTax(address, bool)"];
        const tokenContract = new ethers.Contract(AETH_TOKEN_ADDRESS, tokenAbi, wallet);
        const tx = await tokenContract.setExcludedFromTax(address, true);
        await tx.wait();
        console.log("✅ Presale contract excluded from tax restrictions.");
    } catch (error) {
        console.error("⚠️  Failed to exclude presale from tax:", error.message);
    }

    console.log("------------------------------------------");
    console.log("Next Steps:");
    console.log("1. Send AETH tokens to this contract address to fund the sale.");
    console.log("2. Update 'presale.js' with the new contract address:", address);
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
