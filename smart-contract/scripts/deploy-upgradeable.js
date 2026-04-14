// scripts/deploy-upgradeable.js
// Deploys the AetheronMultiSigTreasury contract as a UUPS upgradeable proxy

import hre from "hardhat";
const { ethers } = hre;
import { deployUupsProxy, getImplementationAddress } from "../utils/uups.mjs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const NEW_OWNER = "0xa0Bd76BDA539cF45e2963e84757516B50FfefFf7";
  const owners = [NEW_OWNER];
  const numConfirmationsRequired = 1; // TODO: Set required confirmations

  const Treasury = await ethers.getContractFactory("AetheronMultiSigTreasury");
  const { proxyAddress } = await deployUupsProxy(Treasury, [
    owners,
    numConfirmationsRequired,
  ]);

  console.log("AetheronMultiSigTreasury (proxy) deployed to:", proxyAddress);
  console.log(
    "Implementation address:",
    await getImplementationAddress(ethers.provider, proxyAddress),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
