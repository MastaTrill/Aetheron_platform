import { ethers } from "ethers";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const RATE = 1000n;
const SOFT_CAP = ethers.parseEther("5");
const HARD_CAP = ethers.parseEther("100");
const MIN_CONTRIBUTION = ethers.parseEther("0.1");
const MAX_CONTRIBUTION = ethers.parseEther("100");
const START_DELAY = 60;
const DURATION = 14 * 24 * 3600;

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("From address:", wallet.address);

    const mockArtifact = JSON.parse(readFileSync("./artifacts/contracts/MockAETH.sol/MockAETH.json", "utf8"));
    const mockFactory = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, wallet);

    console.log("1️⃣ Deploying MockAETH...");
    const mockToken = await mockFactory.deploy();
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("   MockAETH deployed to:", tokenAddress);

    const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));
    const presaleFactory = new ethers.ContractFactory(presaleArtifact.abi, presaleArtifact.bytecode, wallet);

    const startTime = Math.floor(Date.now() / 1000) + START_DELAY;
    const endTime = startTime + DURATION;

    console.log("2️⃣ Deploying AetheronPresaleV2...");
    const presale = await presaleFactory.deploy(
        tokenAddress,
        RATE,
        SOFT_CAP,
        HARD_CAP,
        MIN_CONTRIBUTION,
        MAX_CONTRIBUTION,
        startTime,
        endTime
    );
    await presale.waitForDeployment();
    const address = await presale.getAddress();
    console.log("   Presale deployed to:", address);

    const fundAmount = ethers.parseEther("50000000");
    console.log("3️⃣ Funding presale with 50M mAETH...");
    const fundTx = await mockToken.transfer(address, fundAmount);
    await fundTx.wait();
    const presaleBal = await mockToken.balanceOf(address);
    console.log("   Presale token balance:", ethers.formatEther(presaleBal), "mAETH");

    const currentStart = await presale.startTime();
    const currentEnd = await presale.endTime();
    console.log("4️⃣ Presale schedule:");
    console.log("   Start:", new Date(Number(currentStart) * 1000).toISOString());
    console.log("   End:", new Date(Number(currentEnd) * 1000).toISOString());

    mkdirSync("./deployments", { recursive: true });
    writeFileSync("./deployments/presale-local.json", JSON.stringify({
        network: "localhost",
        presale: address,
        token: tokenAddress,
        treasury: wallet.address,
        rate: RATE.toString(),
        softCapWei: SOFT_CAP.toString(),
        hardCapWei: HARD_CAP.toString(),
        minContributionWei: MIN_CONTRIBUTION.toString(),
        maxContributionWei: MAX_CONTRIBUTION.toString(),
        startTime: Number(startTime),
        endTime: Number(endTime),
        deployedAt: new Date().toISOString()
    }, null, 2));

    writeFileSync("../../presale-config.js", `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${tokenAddress}",
  presaleContractAddress: "${address}",
  maxPresaleTokens: ${Number(HARD_CAP) * Number(RATE)}
};
`);

    console.log("✅ Presale is now LIVE!");
}

main().catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
});