import { ethers } from "ethers";
import { readFileSync } from "fs";

const EXPECTED_CHAIN_ID = 8453n;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY environment variable is required");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, Number(EXPECTED_CHAIN_ID), {
    staticNetwork: true,
    batchMaxCount: 1
  });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Expected Base chain 8453, received ${network.chainId}`);
  }

  console.log("Deploying from the presale deployer address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) {
    throw new Error("Presale deployer has no Base ETH for gas");
  }
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const nftArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/AetheronNFT.sol/AetheronNFT.json", "utf8")
  );
  const marketplaceArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json", "utf8")
  );

  const nftFactory = new ethers.ContractFactory(nftArtifact.abi, nftArtifact.bytecode, wallet);
  console.log("Deploying AetheronNFT...");
  const nftContract = await nftFactory.deploy(
    "Aetheron NFT",
    "ANFT",
    "https://api.aetrs.com/nft/metadata/"
  );
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  const nftOwner = await nftContract.owner();

  if (nftOwner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`NFT owner mismatch: expected ${wallet.address}, received ${nftOwner}`);
  }

  console.log("AetheronNFT deployed to:", nftAddress);
  console.log("AetheronNFT owner:", nftOwner);

  const marketplaceFactory = new ethers.ContractFactory(
    marketplaceArtifact.abi,
    marketplaceArtifact.bytecode,
    wallet
  );
  console.log("Deploying NFTMarketplace...");
  const marketplaceContract = await marketplaceFactory.deploy();
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  console.log("NFTMarketplace deployed to:", marketplaceAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Base mainnet (8453)");
  console.log("Presale/NFT deployer and NFT owner:", wallet.address);
  console.log("AetheronNFT:", nftAddress);
  console.log("NFTMarketplace:", marketplaceAddress);
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with:");
  console.log(`   NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`   NFT_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log("2. Verify contracts on BaseScan");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
