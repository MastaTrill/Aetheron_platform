import { ethers } from "ethers";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon.drpc.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY || PRIVATE_KEY === "0xyour64hexprivatekey") {
    console.error("PRIVATE_KEY environment variable is required");
    process.exit(1);
}

const AETH_TOKEN_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const RATE = 1000n;
const SOFT_CAP = ethers.parseEther("5000");
const HARD_CAP = ethers.parseEther("33333");
const MIN_CONTRIBUTION = ethers.parseEther("0.1");
const MAX_CONTRIBUTION = ethers.parseEther("1000");
const START_DELAY = 3600;
const END_TIME = 1785542399;

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Network:", await provider.getNetwork().then(n => `${n.name} (${n.chainId})`));
    console.log("Deployer:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");

    if (balance < ethers.parseEther("0.05")) {
        console.error("Not enough MATIC for gas. Send at least 0.1 MATIC to:", wallet.address);
        process.exit(1);
    }

    const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function setExcludedFromTax(address, bool)"];
    const token = new ethers.Contract(AETH_TOKEN_ADDRESS, tokenAbi, provider);
    const tokenBal = await token.balanceOf(wallet.address);
    console.log("AETH balance:", ethers.formatEther(tokenBal), "AETH");

    const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));

    const startTime = Math.floor(Date.now() / 1000) + START_DELAY;

    console.log("\nDeploying AetheronPresaleV2...");
    console.log("Token:", AETH_TOKEN_ADDRESS);
    console.log("Treasury (owner):", wallet.address);
    console.log("Rate:", RATE.toString());
    console.log("Soft cap:", ethers.formatEther(SOFT_CAP), "MATIC");
    console.log("Hard cap:", ethers.formatEther(HARD_CAP), "MATIC");
    console.log("Start:", new Date(startTime * 1000).toISOString());
    console.log("End:", new Date(END_TIME * 1000).toISOString());

    const factory = new ethers.ContractFactory(presaleArtifact.abi, presaleArtifact.bytecode, wallet);
    const presale = await factory.deploy(
        AETH_TOKEN_ADDRESS, RATE, SOFT_CAP, HARD_CAP,
        MIN_CONTRIBUTION, MAX_CONTRIBUTION,
        startTime, END_TIME
    );
    await presale.waitForDeployment();
    const presaleAddress = await presale.getAddress();

    console.log("\nPresale deployed to:", presaleAddress);

    console.log("Excluding presale from tax...");
    const tokenWithSigner = token.connect(wallet);
    const tx = await tokenWithSigner.setExcludedFromTax(presaleAddress, true);
    await tx.wait();
    console.log("Presale excluded from tax.");

    const fundAmount = ethers.parseEther("50000000");
    console.log("Funding presale with 50M AETH...");
    const fundTx = await tokenWithSigner.transfer(presaleAddress, fundAmount);
    await fundTx.wait();
    const presaleBal = await token.balanceOf(presaleAddress);
    console.log("Presale token balance:", ethers.formatEther(presaleBal), "AETH");

    const deployment = {
        network: "polygon",
        chainId: 137,
        presale: presaleAddress,
        token: AETH_TOKEN_ADDRESS,
        treasury: wallet.address,
        rate: RATE.toString(),
        softCapWei: SOFT_CAP.toString(),
        hardCapWei: HARD_CAP.toString(),
        minContributionWei: MIN_CONTRIBUTION.toString(),
        maxContributionWei: MAX_CONTRIBUTION.toString(),
        startTime,
        endTime: END_TIME,
        deployedAt: new Date().toISOString()
    };
    mkdirSync("./deployments", { recursive: true });
    writeFileSync("./deployments/presale-polygon.json", JSON.stringify(deployment, null, 2));

    const frontendConfig = `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${AETH_TOKEN_ADDRESS}",
  presaleContractAddress: "${presaleAddress}",
  maxPresaleTokens: ${Number(ethers.formatEther(HARD_CAP)) * Number(RATE)}
};
`;
    writeFileSync("../../presale-config.js", frontendConfig);

    console.log("\nMainnet deployment complete!");
    console.log("Presale:", presaleAddress);
    console.log("Explorer: https://polygonscan.com/address/" + presaleAddress);
    console.log("Deployments saved to: ./deployments/presale-polygon.json");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
