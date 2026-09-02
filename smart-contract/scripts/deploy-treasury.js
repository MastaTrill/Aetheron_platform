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
  sepolia: 11155111,
  base: 8453,
  baseSepolia: 84532,
};

async function main() {
  const networkName = hre.network.name;
  const expectedChainId = Networks[networkName];
  if (!expectedChainId) {
    throw new Error(`Unsupported treasury deployment network: ${networkName}`);
  }

  const providerChainId = Number((await ethers.provider.getNetwork()).chainId);
  if (providerChainId !== expectedChainId) {
    throw new Error(
      `Chain mismatch for ${networkName}: expected ${expectedChainId}, got ${providerChainId}`,
    );
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not set in .env");
  }
  if (!process.env.TREASURY_WALLET) {
    throw new Error("TREASURY_WALLET must be explicitly set");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("Deploying with wallet:", wallet.address);

  const newOwner = process.env.TREASURY_WALLET;
  const numConfirmationsRequired = parseInt(process.env.CONFIRMATIONS || "1", 10);
  if (!Number.isInteger(numConfirmationsRequired) || numConfirmationsRequired < 1) {
    throw new Error("CONFIRMATIONS must be a positive integer");
  }

  console.log(`\nDeploying to ${networkName} (chainId: ${providerChainId})`);
  console.log("Treasury owner:", newOwner);

  const Treasury = await ethers.getContractFactory("AetheronMultiSigTreasury");
  const { proxyAddress } = await deployUupsProxy(Treasury, [
    [newOwner],
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
    chainId: providerChainId,
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    treasury: newOwner,
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
