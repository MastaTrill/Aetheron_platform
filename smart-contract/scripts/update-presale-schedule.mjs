import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

const RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY || PRIVATE_KEY === "0xyour64hexprivatekey") {
    console.error("Set a real PRIVATE_KEY in smart-contract/.env");
    process.exit(1);
}

const PRESALE_ADDRESS = "0x8eB1171E720f5ae30086D154277777Aa65340cf7";
const presaleArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", "utf8"));

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const presale = new ethers.Contract(PRESALE_ADDRESS, presaleArtifact.abi, wallet);

    const currentStart = await presale.startTime();
    const currentEnd = await presale.endTime();
    console.log("Current start:", new Date(Number(currentStart) * 1000).toISOString());
    console.log("Current end:", new Date(Number(currentEnd) * 1000).toISOString());

    const newStart = Math.floor(Date.now() / 1000) + 300;
    const newEnd = 1785542399;
    console.log("\nNew start:", new Date(newStart * 1000).toISOString());
    console.log("New end:", new Date(newEnd * 1000).toISOString());

    console.log("\nUpdating schedule...");
    const tx = await presale.updateSchedule(newStart, newEnd, { gasPrice: 30000000000 });
    await tx.wait();
    console.log("Schedule updated. Tx:", tx.hash);

    const updatedStart = await presale.startTime();
    const updatedEnd = await presale.endTime();
    console.log("Verified start:", new Date(Number(updatedStart) * 1000).toISOString());
    console.log("Verified end:", new Date(Number(updatedEnd) * 1000).toISOString());

    const deployment = JSON.parse(readFileSync("./deployments/presale-amoy.json", "utf8"));
    deployment.startTime = newStart;
    deployment.endTime = newEnd;
    deployment.startTimeISO = new Date(newStart * 1000).toISOString();
    deployment.endTimeISO = new Date(newEnd * 1000).toISOString();
    writeFileSync("./deployments/presale-amoy.json", JSON.stringify(deployment, null, 2));
    console.log("deployments/presale-amoy.json updated");
}

main().catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
});
