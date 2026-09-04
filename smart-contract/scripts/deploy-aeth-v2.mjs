import fs from "node:fs";
import dotenv from "dotenv";
import hre from "hardhat";

dotenv.config();

const BASE_CHAIN_ID = 8453;
const REQUIRED_CONFIRMATION = "CONFIRM_AETH_V2_DEPLOYMENT";
const REQUIRED_LIVE_ACTION = "DEPLOY_AETH_V2_ON_BASE";
const manifestUrl = new URL("../deployments/aeth-v2-migration.json", import.meta.url);
const deploymentUrl = new URL("../deployments/aeth-v2-base.json", import.meta.url);

function requireAddress(ethers, name) {
  const value = String(process.env[name] || "").trim();
  if (!ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(`${name} must be a nonzero EVM address`);
  }
  return ethers.getAddress(value);
}

function requireLiveAuthorization() {
  if (process.env.CONFIRM_AETH_V2_DEPLOYMENT !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `Refusing AETH V2 deployment. Set CONFIRM_AETH_V2_DEPLOYMENT=${REQUIRED_CONFIRMATION} only for an intentional Base Mainnet deployment.`
    );
  }
  if (process.env.LIVE_ACTION !== "true") {
    throw new Error("Refusing AETH V2 deployment unless LIVE_ACTION=true");
  }
  if (process.env.CONFIRM_LIVE_ACTION !== REQUIRED_LIVE_ACTION) {
    throw new Error(
      `Refusing AETH V2 deployment. Set CONFIRM_LIVE_ACTION=${REQUIRED_LIVE_ACTION} only after reviewing the deployment plan.`
    );
  }
}

async function main() {
  const connection = await hre.network.connect();
  const { ethers } = connection;
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== BASE_CHAIN_ID) {
    throw new Error(`AETH V2 production deployment is Base-only. Expected chain ${BASE_CHAIN_ID}, received ${chainId}.`);
  }

  const teamWallet = requireAddress(ethers, "AETH_V2_TEAM_WALLET");
  const marketingWallet = requireAddress(ethers, "AETH_V2_MARKETING_WALLET");
  const stakingPool = requireAddress(ethers, "AETH_V2_STAKING_POOL");
  const destinations = new Set([
    teamWallet.toLowerCase(),
    marketingWallet.toLowerCase(),
    stakingPool.toLowerCase(),
  ]);
  if (destinations.size !== 3) {
    throw new Error("AETH V2 team, marketing, and staking destinations must be distinct");
  }

  requireLiveAuthorization();

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No Base deployment signer is configured. Set PRIVATE_KEY in the operator environment.");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance === 0n) {
    throw new Error("Deployment signer has no ETH for Base gas");
  }

  console.log("AETH V2 deployment plan:");
  console.log(JSON.stringify({
    network: "Base Mainnet",
    chainId,
    deployer: deployer.address,
    teamWallet,
    marketingWallet,
    stakingPool,
    tradingWillRemainDisabled: true,
    ammPairWillRemainUnconfigured: true,
    presaleWillRemainUnfunded: true,
  }, null, 2));

  const AetheronV2 = await ethers.getContractFactory("contracts/AetheronV2.sol:AetheronV2");
  const token = await AetheronV2.deploy(teamWallet, marketingWallet, stakingPool);
  const deploymentTx = token.deploymentTransaction();
  if (!deploymentTx) throw new Error("AETH V2 deployment transaction was not created");

  await token.waitForDeployment();
  const address = await token.getAddress();

  const [owner, tradingEnabled, buyTaxRate, sellTaxRate, totalSupply] = await Promise.all([
    token.owner(),
    token.tradingEnabled(),
    token.buyTaxRate(),
    token.sellTaxRate(),
    token.totalSupply(),
  ]);

  const expectedSupply = ethers.parseUnits("1000000000", 18);
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) throw new Error("Unexpected AETH V2 owner after deployment");
  if (tradingEnabled) throw new Error("AETH V2 unexpectedly deployed with trading enabled");
  if (buyTaxRate !== 3n || sellTaxRate !== 5n) throw new Error("Unexpected AETH V2 tax constants after deployment");
  if (totalSupply !== expectedSupply) throw new Error("Unexpected AETH V2 total supply after deployment");

  const receipt = await deploymentTx.wait();
  const evidence = {
    network: "Base Mainnet",
    chainId,
    address,
    status: "deployed_not_cutover",
    deploymentTransactionHash: deploymentTx.hash,
    deploymentBlockNumber: receipt?.blockNumber ?? null,
    deployer: deployer.address,
    owner,
    teamWallet,
    marketingWallet,
    stakingPool,
    buyTaxRate: Number(buyTaxRate),
    sellTaxRate: Number(sellTaxRate),
    totalSupply: totalSupply.toString(),
    tradingEnabled,
    liquidityConfigured: false,
    migrationAuthorized: false,
    publicLaunchAuthorized: false,
    recordedAt: new Date().toISOString(),
  };
  fs.writeFileSync(deploymentUrl, `${JSON.stringify(evidence, null, 2)}\n`);

  const manifest = JSON.parse(fs.readFileSync(manifestUrl, "utf8"));
  manifest.v2.address = address;
  manifest.v2.status = "deployed_not_cutover";
  manifest.v2.deploymentTransactionHash = deploymentTx.hash;
  manifest.v2.deploymentBlockNumber = receipt?.blockNumber ?? null;
  if (!manifest.cutover?.evidence) {
    throw new Error("AETH V2 migration manifest is missing cutover evidence gates");
  }
  manifest.cutover.targetAddress = address;
  manifest.cutover.authorized = false;
  manifest.cutover.evidence.v2AddressRecorded = true;
  manifest.cutover.evidence.runtimeVerified = true;
  manifest.cutover.evidence.supplyVerified = true;
  manifest.cutover.evidence.sourceVerified = false;
  manifest.cutover.evidence.balanceMigrationPlanApproved = false;
  manifest.cutover.evidence.canonicalRegistryUpdated = false;
  manifest.cutover.evidence.releaseAuthorized = false;
  manifest.publicLaunchAuthorized = false;
  manifest.liquidityAuthorized = false;
  manifest.migrationAuthorized = false;
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`AETH V2 deployed at ${address}`);
  console.log(`BaseScan: https://basescan.org/address/${address}`);
  console.log("Trading, AMM configuration, liquidity, presale funding, and canonical cutover remain disabled.");
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
