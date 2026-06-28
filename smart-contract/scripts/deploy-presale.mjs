import { ethers } from "ethers";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon.drpc.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AETH_TOKEN_ADDRESS = process.env.AETH_TOKEN_ADDRESS || "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa";
const RATE = BigInt(process.env.PRESALE_RATE || "1000");
const SOFT_CAP = ethers.parseEther(process.env.PRESALE_SOFT_CAP_MATIC || "5000");
const HARD_CAP = ethers.parseEther(process.env.PRESALE_HARD_CAP_MATIC || "33333.333333333333333333");
const MIN_CONTRIBUTION = ethers.parseEther(process.env.PRESALE_MIN_MATIC || "0.1");
const MAX_CONTRIBUTION = ethers.parseEther(process.env.PRESALE_MAX_MATIC || "1000");
const START_DELAY_SECONDS = Number(process.env.PRESALE_START_DELAY_SECONDS || 3600);
const DURATION_SECONDS = Number(process.env.PRESALE_DURATION_SECONDS || 14 * 24 * 3600);

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

    const startTime = Math.floor(Date.now() / 1000) + START_DELAY_SECONDS;
    const endTime = startTime + DURATION_SECONDS;

    const presaleFactory = new ethers.ContractFactory(presaleArtifact.abi, presaleArtifact.bytecode, wallet);
    console.log("Deploying AetheronPresaleV2...");
    const presale = await presaleFactory.deploy(
        AETH_TOKEN_ADDRESS,
        RATE,
        SOFT_CAP,
        HARD_CAP,
        MIN_CONTRIBUTION,
        MAX_CONTRIBUTION,
        startTime,
        endTime,
        TREASURY_ADDRESS
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
        throw new Error(`Failed to exclude presale from tax. Do not launch until fixed: ${error.message}`);
    }

    const maxPresaleTokens = Number(ethers.formatEther(HARD_CAP)) * Number(RATE);
    const frontendConfig = `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${AETH_TOKEN_ADDRESS}",
  presaleContractAddress: "${address}",
  maxPresaleTokens: ${Math.floor(maxPresaleTokens)}
};
`;
    writeFileSync(new URL("../../presale-config.js", import.meta.url), frontendConfig);

    mkdirSync("./deployments", { recursive: true });
    writeFileSync("./deployments/presale-polygon.json", JSON.stringify({
        network: "polygon",
        presale: address,
        token: AETH_TOKEN_ADDRESS,
        treasury: TREASURY_ADDRESS,
        rate: RATE.toString(),
        softCapWei: SOFT_CAP.toString(),
        hardCapWei: HARD_CAP.toString(),
        minContributionWei: MIN_CONTRIBUTION.toString(),
        maxContributionWei: MAX_CONTRIBUTION.toString(),
        startTime,
        endTime,
        deployedAt: new Date().toISOString()
    }, null, 2));

    console.log("------------------------------------------");
    console.log("Next Steps:");
    console.log("1. Send AETH tokens to this contract address to fund the sale.");
    console.log("2. Deploy the updated website files, including presale-config.js.");
    console.log("3. Confirm https://aetrs.com/presale.js and /presale-config.js show the deployed address.");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
