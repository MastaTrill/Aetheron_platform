import hre from "hardhat";

const CANONICAL_BASE_AETH = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";

async function main() {
  const connection = await hre.network.connect();
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();
  const tokenAddress = process.env.AETH_TOKEN_ADDRESS || CANONICAL_BASE_AETH;

  if (!ethers.isAddress(tokenAddress) || tokenAddress === ethers.ZeroAddress) {
    throw new Error("AETH_TOKEN_ADDRESS must be a valid non-zero EVM address");
  }

  console.log("Deploying AetheronStaking with account:", deployer.address);
  console.log("AETH token:", tokenAddress);

  const Staking = await ethers.getContractFactory("AetheronStaking");
  const staking = await Staking.deploy(tokenAddress);
  await staking.waitForDeployment();

  console.log("AetheronStaking deployed to:", await staking.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
