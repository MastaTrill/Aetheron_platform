import { ethers } from "ethers";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

const RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY || PRIVATE_KEY === "0xyour64hexprivatekey") {
    console.error("Set a real PRIVATE_KEY in smart-contract/.env");
    process.exit(1);
}

const RATE = 1000n;
const SOFT_CAP = ethers.parseEther("5000");
const HARD_CAP = ethers.parseEther("33333");
const MIN_CONTRIBUTION = ethers.parseEther("0.1");
const MAX_CONTRIBUTION = ethers.parseEther("1000");
const DURATION_SECONDS = 14 * 24 * 3600;

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Network:", await provider.getNetwork().then(n => `${n.name} (${n.chainId})`));
    console.log("Deployer:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");

    if (balance < ethers.parseEther("0.05")) {
        console.error("Deployer may not have enough MATIC. Need ~0.1 MATIC for both deployments.");
        console.error("  Get more at: https://faucet.polygon.technology/");
        console.error("  Current balance:", ethers.formatEther(balance), "MATIC");
        process.exit(1);
    }

    // 1. Deploy MockAETH
    const mockArtifact = JSON.parse(readFileSync("./artifacts/contracts/MockAETH.sol/MockAETH.json", "utf8"));
    console.log("\n1️⃣  Deploying MockAETH...");
    const mockFactory = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, wallet);
    console.log("\n1️⃣  Deploying MockAETH...");
    const mockToken = await mockFactory.deploy({ gasPrice: 30000000000 });
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("   MockAETH deployed to:", tokenAddress);

    // 2. Deploy Presale
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 300;
    const endTime = 1785542399;

    const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));
    console.log("\n2️⃣  Deploying AetheronPresaleV2...");
    const presaleFactory = new ethers.ContractFactory(presaleArtifact.abi, presaleArtifact.bytecode, wallet);
    console.log("\n2️⃣  Deploying AetheronPresaleV2...");
    const presale = await presaleFactory.deploy(
        tokenAddress,
        RATE,
        SOFT_CAP,
        HARD_CAP,
        MIN_CONTRIBUTION,
        MAX_CONTRIBUTION,
        startTime,
        endTime,
        wallet.address,
        { gasPrice: 30000000000 }
    );
    await presale.waitForDeployment();
    const presaleAddress = await presale.getAddress();
    console.log("   Presale deployed to:", presaleAddress);
    console.log("   Start:", new Date(startTime * 1000).toISOString());
    console.log("   End:", new Date(endTime * 1000).toISOString());

    // 3. Fund presale with tokens (50M AETH for the sale)
    const fundAmount = ethers.parseEther("50000000");
    console.log("\n3️⃣  Funding presale with 50M mAETH...");
    const fundTx = await mockToken.transfer(presaleAddress, fundAmount, { gasPrice: 30000000000 });
    await fundTx.wait();
    const presaleBal = await mockToken.balanceOf(presaleAddress);
    console.log("   Presale token balance:", ethers.formatEther(presaleBal), "mAETH");

    // 4. Verify state
    const presaleContract = new ethers.Contract(presaleAddress, presaleArtifact.abi, provider);
    const [rate, softCap, hardCap, raised] = await Promise.all([
        presaleContract.rate(),
        presaleContract.softCap(),
        presaleContract.hardCap(),
        presaleContract.weiRaised()
    ]);
    console.log("\n✅ Deployment verified:");
    console.log("   Rate:", rate.toString());
    console.log("   Soft cap:", ethers.formatEther(softCap), "MATIC");
    console.log("   Hard cap:", ethers.formatEther(hardCap), "MATIC");
    console.log("   Raised:", ethers.formatEther(raised), "MATIC");

    // Save deployment info
    mkdirSync("./deployments", { recursive: true });
    const deployment = {
        network: "polygon-amoy",
        chainId: 80002,
        presale: presaleAddress,
        token: tokenAddress,
        treasury: wallet.address,
        rate: RATE.toString(),
        softCapWei: SOFT_CAP.toString(),
        hardCapWei: HARD_CAP.toString(),
        minContributionWei: MIN_CONTRIBUTION.toString(),
        maxContributionWei: MAX_CONTRIBUTION.toString(),
        startTime,
        endTime,
        deployedAt: new Date().toISOString()
    };
    writeFileSync("./deployments/presale-amoy.json", JSON.stringify(deployment, null, 2));

    console.log("\n------------------------------------------");
    console.log("🎉 All deployed on Polygon Amoy!");
    console.log("   Presale:", presaleAddress);
    console.log("   Token:", tokenAddress);
    console.log("   Explorer: https://amoy.polygonscan.com/address/" + presaleAddress);
    console.log("   Saved to: ./deployments/presale-amoy.json");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
