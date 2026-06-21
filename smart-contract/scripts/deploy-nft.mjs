import { ethers } from "ethers";
import { readFileSync } from "fs";

const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY environment variable is required");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deploying from address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  const nftArtifact = JSON.parse(readFileSync("./artifacts/contracts/AetheronNFT.sol/AetheronNFT.json", "utf8"));
  const marketplaceArtifact = JSON.parse(readFileSync("./artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json", "utf8"));

  const nftFactory = new ethers.ContractFactory(nftArtifact.abi, nftArtifact.bytecode, wallet);
  console.log("Deploying AetheronNFT...");
  const nftContract = await nftFactory.deploy("Aetheron NFT", "ANFT", "https://api.aetrs.com/nft/metadata/");
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("AetheronNFT deployed to:", nftAddress);

  const marketplaceFactory = new ethers.ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
  console.log("Deploying NFTMarketplace...");
  const marketplaceContract = await marketplaceFactory.deploy();
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  console.log("NFTMarketplace deployed to:", marketplaceAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("AetheronNFT:", nftAddress);
  console.log("NFTMarketplace:", marketplaceAddress);
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with:");
  console.log(`   NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`   NFT_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log("2. Verify contracts on PolygonScan");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
