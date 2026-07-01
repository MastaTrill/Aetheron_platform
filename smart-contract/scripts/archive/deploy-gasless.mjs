import { ethers } from "ethers";
import { readFileSync } from "fs";

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");
const signer = new ethers.Wallet("0x28b14ebc6a7ae419a4d8eecd67fa105423a9861498a6183cc71d1fb875634449", provider);

const AETH = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const TREASURY = "0xF941B28F3B4188c473a4C8C78845ebab58654BA6";
const RATE = 1000n;
const SOFT_CAP = ethers.parseEther("5000");
const HARD_CAP = ethers.parseEther("33333");
const MIN_CONTRIBUTION = ethers.parseEther("0.1");
const MAX_CONTRIBUTION = ethers.parseEther("1000");
const END_TIME = 1785542399;

async function main() {
    const { BiconomySmartAccountV2, PaymasterMode, createSmartAccountClient } = await import("@biconomy/account");
    const { Bundler } = await import("@biconomy/bundler");
    const { BiconomyPaymaster } = await import("@biconomy/paymaster");

    console.log("Setting up with Stackup bundler...");

    // Stackup free bundler for Polygon
    const bundler = new Bundler({
        bundlerUrl: "https://api.stackup.sh/v1/node/YOUR_API_KEY",
        chainId: 137,
    });

    // Try without paymaster first - just relay
    const smartAccount = await createSmartAccountClient({
        signer,
        chainId: 137,
        bundler,
    });

    const smartAccountAddress = await smartAccount.getAccountAddress();
    console.log("Smart account:", smartAccountAddress);

    const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));
    const startTime = Math.floor(Date.now() / 1000) + 3600;

    const factory = new ethers.ContractFactory(presaleArtifact.abi, presaleArtifact.bytecode);
    const deployData = factory.getDeployTransaction(
        AETH, RATE, SOFT_CAP, HARD_CAP,
        MIN_CONTRIBUTION, MAX_CONTRIBUTION,
        startTime, END_TIME, TREASURY
    );

    console.log("\nDeploying presale via gasless UserOperation...");

    try {
        const userOpResponse = await smartAccount.sendTransaction({
            to: ethers.ZeroAddress,
            data: deployData.data,
        });
        console.log("UserOp sent, waiting...");
        const receipt = await userOpResponse.wait();
        console.log("Deployed! Tx:", receipt.transactionHash);
    } catch (error) {
        console.error("Failed:", error.message);
    }
}

main().catch(console.error);
