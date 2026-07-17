import fs from "node:fs";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const INVALID_PRESALE = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
const DEFAULT_TOKEN = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";

function required(name, fallback = undefined) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const rpcUrl = required("BASE_RPC_URL", "https://mainnet.base.org");
const privateKey = required("PRIVATE_KEY");
const tokenAddress = required("AETH_TOKEN_ADDRESS", DEFAULT_TOKEN);
const treasuryAddress = required("TREASURY_ADDRESS");
const rate = BigInt(required("PRESALE_RATE"));
const softCap = ethers.parseEther(required("PRESALE_SOFT_CAP_ETH"));
const hardCap = ethers.parseEther(required("PRESALE_HARD_CAP_ETH"));
const minContribution = ethers.parseEther(required("PRESALE_MIN_ETH"));
const maxContribution = ethers.parseEther(required("PRESALE_MAX_ETH"));
const startDelay = Number(process.env.PRESALE_START_DELAY_SECONDS || "14400");
const duration = Number(process.env.PRESALE_DURATION_SECONDS || String(10 * 24 * 60 * 60));
const dryRun = process.env.DRY_RUN === "true";

requireCondition(ethers.isAddress(tokenAddress), "AETH_TOKEN_ADDRESS is invalid");
requireCondition(ethers.isAddress(treasuryAddress), "TREASURY_ADDRESS is invalid");
requireCondition(rate > 0n, "PRESALE_RATE must be positive");
requireCondition(softCap > 0n && softCap <= hardCap, "Presale caps are invalid");
requireCondition(minContribution > 0n && minContribution <= maxContribution, "Contribution limits are invalid");
requireCondition(startDelay >= 3600, "Start delay must be at least one hour");
requireCondition(duration >= 24 * 60 * 60, "Presale duration must be at least one day");

if (!dryRun) {
  requireCondition(
    process.env.CONFIRM_BASE_MAINNET_DEPLOY === "DEPLOY_CORRECTED_PRESALE",
    "Set CONFIRM_BASE_MAINNET_DEPLOY=DEPLOY_CORRECTED_PRESALE to authorize a Base mainnet deployment"
  );
}

const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
  staticNetwork: true,
  batchMaxCount: 1
});
const wallet = new ethers.Wallet(privateKey, provider);

const TOKEN_ABI = [
  "function owner() view returns (address)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function isExcludedFromTax(address) view returns (bool)",
  "function setExcludedFromTax(address,bool)",
  "function transfer(address,uint256) returns (bool)"
];

const token = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
const network = await provider.getNetwork();
requireCondition(network.chainId === EXPECTED_CHAIN_ID, `Expected Base chain 8453, received ${network.chainId}`);
requireCondition((await provider.getCode(tokenAddress)) !== "0x", "Configured AETH token has no Base bytecode");

const [tokenOwner, tokenDecimals, walletTokenBalance, walletEthBalance] = await Promise.all([
  token.owner(),
  token.decimals(),
  token.balanceOf(wallet.address),
  provider.getBalance(wallet.address)
]);

requireCondition(tokenOwner.toLowerCase() === wallet.address.toLowerCase(), "Deployment wallet is not the AETH token owner");
requireCondition(walletEthBalance > 0n, "Deployment wallet has no Base ETH for gas");

const fundingAmount = hardCap * rate;
requireCondition(walletTokenBalance >= fundingAmount, `Wallet needs ${ethers.formatUnits(fundingAmount, tokenDecimals)} AETH to fully fund the hard cap`);

const startTime = Math.floor(Date.now() / 1000) + startDelay;
const endTime = startTime + duration;
const parameters = {
  chainId: network.chainId.toString(),
  deployer: wallet.address,
  tokenAddress,
  treasuryAddress,
  rate: rate.toString(),
  softCap: ethers.formatEther(softCap),
  hardCap: ethers.formatEther(hardCap),
  minContribution: ethers.formatEther(minContribution),
  maxContribution: ethers.formatEther(maxContribution),
  fundingTokens: ethers.formatUnits(fundingAmount, tokenDecimals),
  startTime: new Date(startTime * 1000).toISOString(),
  endTime: new Date(endTime * 1000).toISOString(),
  replacesInvalidPresale: INVALID_PRESALE,
  dryRun
};
console.log(JSON.stringify(parameters, null, 2));

if (dryRun) {
  console.log("Dry run complete. No transaction was sent.");
  process.exit(0);
}

const artifactUrl = new URL("../artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json", import.meta.url);
const artifact = JSON.parse(fs.readFileSync(artifactUrl, "utf8"));
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

console.log("Deploying corrected AetheronPresaleV2...");
const presale = await factory.deploy(
  tokenAddress,
  rate,
  softCap,
  hardCap,
  minContribution,
  maxContribution,
  startTime,
  endTime,
  treasuryAddress
);
await presale.waitForDeployment();
const presaleAddress = await presale.getAddress();
requireCondition(presaleAddress.toLowerCase() !== INVALID_PRESALE.toLowerCase(), "Unexpected reuse of invalid presale address");
requireCondition((await provider.getCode(presaleAddress)) !== "0x", "Corrected presale deployment has no bytecode");
requireCondition((await presale.token()).toLowerCase() === tokenAddress.toLowerCase(), "New presale token linkage is incorrect");
requireCondition((await presale.treasury()).toLowerCase() === treasuryAddress.toLowerCase(), "New presale treasury linkage is incorrect");

console.log("Excluding corrected presale from AETH tax...");
await (await token.setExcludedFromTax(presaleAddress, true)).wait();
requireCondition(await token.isExcludedFromTax(presaleAddress), "Corrected presale was not excluded from tax");

console.log(`Funding corrected presale with ${ethers.formatUnits(fundingAmount, tokenDecimals)} AETH...`);
await (await token.transfer(presaleAddress, fundingAmount)).wait();
const inventory = await token.balanceOf(presaleAddress);
requireCondition(inventory >= fundingAmount, "Corrected presale funding verification failed");

const deployment = {
  network: "base",
  chainId: 8453,
  status: "deployed-awaiting-final-verification",
  timestamp: new Date().toISOString(),
  contracts: {
    Aetheron: { address: tokenAddress },
    Presale: { address: presaleAddress }
  },
  wallets: {
    owner: wallet.address,
    treasury: treasuryAddress
  },
  parameters: {
    rate: rate.toString(),
    softCapWei: softCap.toString(),
    hardCapWei: hardCap.toString(),
    minContributionWei: minContribution.toString(),
    maxContributionWei: maxContribution.toString(),
    startTime,
    endTime,
    fundedTokenUnits: fundingAmount.toString()
  },
  replacesInvalidPresale: {
    address: INVALID_PRESALE,
    reason: "token() did not match the configured Base AETH token"
  }
};

const deploymentUrl = new URL("../deployments/presale-base.json", import.meta.url);
fs.writeFileSync(deploymentUrl, JSON.stringify(deployment, null, 2) + "\n");

const maxPresaleTokens = Number(ethers.formatUnits(fundingAmount, tokenDecimals));
const frontendConfig = `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${tokenAddress}",
  presaleContractAddress: "${presaleAddress}",
  status: "deployed-awaiting-final-verification",
  maxPresaleTokens: ${Math.floor(maxPresaleTokens)},
  network: "base",
  chainId: 8453,
  nativeSymbol: "ETH",
  minContribution: ${Number(ethers.formatEther(minContribution))},
  maxContribution: ${Number(ethers.formatEther(maxContribution))}
};
`;
fs.writeFileSync(new URL("../../presale-config.js", import.meta.url), frontendConfig);

console.log(JSON.stringify({
  success: true,
  tokenAddress,
  presaleAddress,
  inventory: ethers.formatUnits(inventory, tokenDecimals),
  deploymentFile: "smart-contract/deployments/presale-base.json",
  frontendConfig: "presale-config.js"
}, null, 2));
console.log("Commit the generated files, run verify:base:readonly, and do not open the sale until that gate passes.");
