// scripts/deploy-treasury.js
// Automated deployment script for AetheronMultiSigTreasury

import hre from "hardhat";
const { ethers } = hre;
import { deployUupsProxy, getImplementationAddress } from "../utils/uups.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Networks = {
  polygon: 137,
  mumbai: 80002,
  sepolia: 11155111,
  base: 8453,
  baseSepolia: 84532,
};

async function main() {
  const networkName = hre.network.name;
  const chainId =
    Networks[networkName] || (await ethers.provider.getNetwork()).chainId;

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not set in .env");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("Deploying with wallet:", wallet.address);

  const NEW_OWNER = process.env.TREASURY_WALLET || wallet.address;
  const numConfirmationsRequired = parseInt(process.env.CONFIRMATIONS || "1");

  console.log(`\nDeploying to ${networkName} (chainId: ${chainId})`);
  console.log("Treasury owner:", NEW_OWNER);

  const Treasury = await ethers.getContractFactory("AetheronMultiSigTreasury");
  const { proxyAddress } = await deployUupsProxy(Treasury, [
    [NEW_OWNER],
    numConfirmationsRequired,
  ]);

  const implementationAddress = await getImplementationAddress(
    ethers.provider,
    proxyAddress,
  );

  console.log("\n✅ Deployment successful!");
  console.log("Proxy:", proxyAddress);
  console.log("Implementation:", implementationAddress);

  const deploymentInfo = {
    network: networkName,
    chainId: Number(chainId),
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    treasury: NEW_OWNER,
    proxy: proxyAddress,
    implementation: implementationAddress,
  };

  const outputPath = path.join(__dirname, "..", "deployment-output.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", outputPath);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
