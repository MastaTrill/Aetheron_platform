// scripts/deploy-vault.js
// Deploys the AetheronRetainerVault contract

import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();
  const NEW_OWNER = "0xa0Bd76BDA539cF45e2963e84757516B50FfefFf7";
  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString(),
  );

  // Deploy Retainer Vault
  const Vault = await ethers.getContractFactory("AetheronRetainerVault");
  const vault = await Vault.deploy(NEW_OWNER);

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("AetheronRetainerVault deployed to:", vaultAddress);

  // Verify ownership
  const owner = await vault.owner();
  console.log("Vault owner:", owner);

  // Save deployment info
  console.log("\n--- Deployment Summary ---");
  console.log("Network:", hre.network.name);
  console.log("Vault Address:", vaultAddress);
  console.log("Owner:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
