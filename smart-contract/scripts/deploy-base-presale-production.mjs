import fs from "node:fs";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ override: true });

const production = JSON.parse(
  fs.readFileSync(new URL("../config/presale-base-production.json", import.meta.url), "utf8")
);

const INVALID_PRESALE = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
const EXPECTED_CHAIN_ID = 8453n;
const VIEW_RETRY_ATTEMPTS = 5;
const VIEW_RETRY_DELAY_MS = 1500;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function setDefault(name, value) {
  if (!process.env[name]) process.env[name] = String(value);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readViewWithRetry(contract, method, label) {
  let lastError;

  for (let attempt = 1; attempt <= VIEW_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const value = await contract[method]();
      requireCondition(value !== null && value !== undefined, `${label} returned no value`);
      return value;
    } catch (error) {
      lastError = error;
      const reason = error.shortMessage || error.reason || error.message || String(error);
      console.warn(`${label} read attempt ${attempt}/${VIEW_RETRY_ATTEMPTS} failed: ${reason}`);
      if (attempt < VIEW_RETRY_ATTEMPTS) await sleep(VIEW_RETRY_DELAY_MS);
    }
  }

  const reason = lastError?.shortMessage || lastError?.reason || lastError?.message || String(lastError);
  throw new Error(`${label} could not be read after ${VIEW_RETRY_ATTEMPTS} attempts: ${reason}`);
}

setDefault("BASE_RPC_URL", production.rpcUrl);
setDefault("AETH_TOKEN_ADDRESS", production.tokenAddress);
setDefault("TREASURY_ADDRESS", production.treasuryAddress);
setDefault("PRESALE_RATE", production.rateAethPerEth);
setDefault("PRESALE_SOFT_CAP_ETH", production.softCapEth);
setDefault("PRESALE_HARD_CAP_ETH", production.hardCapEth);
setDefault("PRESALE_MIN_ETH", production.minContributionEth);
setDefault("PRESALE_MAX_ETH", production.maxContributionEth);
setDefault("PRESALE_START_DELAY_SECONDS", production.startDelaySeconds);
setDefault("PRESALE_DURATION_SECONDS", production.durationSeconds);

const privateKey = process.env.PRIVATE_KEY;
requireCondition(privateKey, "PRIVATE_KEY is required");

const dryRun = process.env.DRY_RUN === "true";
const tokenAddress = process.env.AETH_TOKEN_ADDRESS;
const treasuryAddress = process.env.TREASURY_ADDRESS;
const rate = BigInt(process.env.PRESALE_RATE);
const softCap = ethers.parseEther(process.env.PRESALE_SOFT_CAP_ETH);
const hardCap = ethers.parseEther(process.env.PRESALE_HARD_CAP_ETH);
const minimum = ethers.parseEther(process.env.PRESALE_MIN_ETH);
const maximum = ethers.parseEther(process.env.PRESALE_MAX_ETH);
const startDelay = Number(process.env.PRESALE_START_DELAY_SECONDS);
const duration = Number(process.env.PRESALE_DURATION_SECONDS);

requireCondition(
  tokenAddress.toLowerCase() === production.tokenAddress.toLowerCase(),
  "Production deployment token address does not match the approved Base AETH token"
);
requireCondition(
  treasuryAddress.toLowerCase() === production.treasuryAddress.toLowerCase(),
  "Production deployment treasury does not match the approved treasury"
);
requireCondition(rate === BigInt(production.rateAethPerEth), "Production presale rate was modified");
requireCondition(softCap === ethers.parseEther(production.softCapEth), "Production soft cap was modified");
requireCondition(hardCap === ethers.parseEther(production.hardCapEth), "Production hard cap was modified");
requireCondition(minimum === ethers.parseEther(production.minContributionEth), "Production minimum contribution was modified");
requireCondition(maximum === ethers.parseEther(production.maxContributionEth), "Production maximum contribution was modified");
requireCondition(startDelay === Number(production.startDelaySeconds), "Production start delay was modified");
requireCondition(duration === Number(production.durationSeconds), "Production duration was modified");
requireCondition(hardCap * rate === ethers.parseUnits(production.fundingAeth, 18), "Production funding arithmetic is inconsistent");

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL, Number(EXPECTED_CHAIN_ID), {
  staticNetwork: true,
  batchMaxCount: 1
});
const wallet = new ethers.Wallet(privateKey, provider);
const network = await provider.getNetwork();
requireCondition(network.chainId === EXPECTED_CHAIN_ID, `Expected Base chain 8453, received ${network.chainId}`);
requireCondition(
  wallet.address.toLowerCase() === production.treasuryAddress.toLowerCase(),
  "Protected signer is not the approved Base owner/treasury wallet"
);

const invalidCode = await provider.getCode(INVALID_PRESALE);
requireCondition(invalidCode !== "0x", "Recorded invalid presale has no Base bytecode");

const invalidPresale = new ethers.Contract(
  INVALID_PRESALE,
  [
    "function owner() view returns (address)",
    "function token() view returns (address)",
    "function cancelled() view returns (bool)"
  ],
  provider
);

const invalidOwner = await readViewWithRetry(invalidPresale, "owner", "Invalid presale owner()");
const invalidLinkedToken = await readViewWithRetry(invalidPresale, "token", "Invalid presale token()");
const invalidCancelled = await readViewWithRetry(invalidPresale, "cancelled", "Invalid presale cancelled()");

requireCondition(
  invalidOwner.toLowerCase() === wallet.address.toLowerCase(),
  "Protected signer is not the invalid presale owner"
);
requireCondition(
  invalidLinkedToken.toLowerCase() !== production.tokenAddress.toLowerCase(),
  "Safety stop: the recorded invalid presale now links to the approved AETH token"
);
if (!dryRun) {
  requireCondition(invalidCancelled, "Invalid presale must be cancelled before replacement deployment");
}

console.log(JSON.stringify({
  productionGuard: "passed",
  chainId: network.chainId.toString(),
  signer: wallet.address,
  tokenAddress,
  treasuryAddress,
  invalidPresale: INVALID_PRESALE,
  invalidPresaleCancelled: invalidCancelled,
  viewRetryAttempts: VIEW_RETRY_ATTEMPTS,
  dryRun
}, null, 2));

await import("./deploy-base-presale-safe.mjs");
