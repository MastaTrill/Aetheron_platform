import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const EXPECTED_CHAIN_ID = 84532n;
const CONFIRMATION = "DEPLOY_BASE_SEPOLIA_REHEARSAL";
const DEFAULT_PURCHASE_ETH = "0.0001";
const DEFAULT_RATE = 1_000_000n;
const DEFAULT_START_DELAY_SECONDS = 20;
const DEFAULT_DURATION_SECONDS = 3600;
const DEFAULT_MIN_BALANCE_ETH = "0.01";

function required(name) {
  const value = String(process.env[name] || "").trim().replace(/^['"]|['"]$/g, "");
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizePrivateKey(value) {
  const key = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  return key.startsWith("0x") ? key : `0x${key}`;
}

function loadArtifact(smartContractDir, sourceName, contractName) {
  const artifactPath = path.join(
    smartContractDir,
    "artifacts",
    "contracts",
    sourceName,
    `${contractName}.json`
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Missing artifact ${artifactPath}; run npm run compile first`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function waitUntil(provider, targetTimestamp) {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const block = await provider.getBlock("latest");
    if (block && block.timestamp >= targetTimestamp) return block.timestamp;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Base Sepolia did not reach sale start timestamp ${targetTimestamp}`);
}

function transactionEvidence(receipt) {
  return {
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    gasUsed: receipt.gasUsed?.toString() || null,
  };
}

async function expectRevert(label, operation) {
  try {
    await operation();
  } catch (error) {
    return error?.shortMessage || error?.reason || error?.message || String(error);
  }
  throw new Error(`${label} unexpectedly succeeded`);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const smartContractDir = path.resolve(scriptDir, "..");
const deploymentPath = path.join(
  smartContractDir,
  "deployments",
  "base-sepolia-presale-rehearsal.json"
);

const rpcUrl = required("BASE_SEPOLIA_RPC_URL");
const privateKey = normalizePrivateKey(required("PRIVATE_KEY"));
assert(/^0x[0-9a-fA-F]{64}$/.test(privateKey), "PRIVATE_KEY must be a 32-byte hexadecimal key");

const dryRun = process.env.DRY_RUN === "true";
if (!dryRun) {
  assert(
    process.env.CONFIRM_BASE_SEPOLIA_REHEARSAL === CONFIRMATION,
    `CONFIRM_BASE_SEPOLIA_REHEARSAL must equal ${CONFIRMATION}`
  );
}

const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
  staticNetwork: true,
  batchMaxCount: 1,
});
const wallet = new ethers.Wallet(privateKey, provider);
const network = await provider.getNetwork();
assert(network.chainId === EXPECTED_CHAIN_ID, `Expected chain 84532, received ${network.chainId}`);

const balance = await provider.getBalance(wallet.address);
const minimumBalance = ethers.parseEther(process.env.MIN_REHEARSAL_BALANCE_ETH || DEFAULT_MIN_BALANCE_ETH);
assert(
  balance >= minimumBalance,
  `Rehearsal deployer ${wallet.address} has ${ethers.formatEther(balance)} ETH; at least ${ethers.formatEther(minimumBalance)} ETH is required`
);

const treasury = String(process.env.REHEARSAL_TREASURY_ADDRESS || wallet.address).trim();
assert(ethers.isAddress(treasury) && treasury !== ethers.ZeroAddress, "REHEARSAL_TREASURY_ADDRESS is invalid");

const tokenArtifact = loadArtifact(smartContractDir, "MockAETH.sol", "MockAETH");
const presaleArtifact = loadArtifact(smartContractDir, "AetheronPresale.sol", "AetheronPresaleV2");
const stakingArtifact = loadArtifact(smartContractDir, "AetheronStaking.sol", "AetheronStaking");

const purchaseWei = ethers.parseEther(process.env.REHEARSAL_PURCHASE_ETH || DEFAULT_PURCHASE_ETH);
const rate = BigInt(process.env.REHEARSAL_RATE || DEFAULT_RATE.toString());
const startDelay = Number(process.env.REHEARSAL_START_DELAY_SECONDS || DEFAULT_START_DELAY_SECONDS);
const duration = Number(process.env.REHEARSAL_DURATION_SECONDS || DEFAULT_DURATION_SECONDS);
assert(purchaseWei > 0n, "REHEARSAL_PURCHASE_ETH must be positive");
assert(rate > 0n, "REHEARSAL_RATE must be positive");
assert(startDelay >= 5 && startDelay <= 300, "REHEARSAL_START_DELAY_SECONDS must be between 5 and 300");
assert(duration >= 300, "REHEARSAL_DURATION_SECONDS must be at least 300");

const readiness = {
  chainId: network.chainId.toString(),
  deployer: wallet.address,
  deployerBalanceEth: ethers.formatEther(balance),
  treasury,
  purchaseEth: ethers.formatEther(purchaseWei),
  rate: rate.toString(),
  releaseCommit: process.env.RELEASE_COMMIT || process.env.GITHUB_SHA || null,
  dryRun,
};
console.log(JSON.stringify({ rehearsalReadiness: readiness }, null, 2));

if (dryRun) {
  console.log("BASE SEPOLIA PRESALE REHEARSAL READINESS: PASS");
  process.exit(0);
}

fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
if (fs.existsSync(deploymentPath) && process.env.ALLOW_REHEARSAL_OVERWRITE !== "true") {
  throw new Error(`Refusing to overwrite ${deploymentPath}; set ALLOW_REHEARSAL_OVERWRITE=true for an intentional rerun`);
}

const manifest = {
  schemaVersion: 1,
  status: "deploying",
  network: "base-sepolia",
  chainId: Number(EXPECTED_CHAIN_ID),
  releaseCommit: readiness.releaseCommit,
  workflowRunId: process.env.GITHUB_RUN_ID || null,
  deployer: wallet.address,
  treasury,
  startedAt: new Date().toISOString(),
  completedAt: null,
  parameters: {
    purchaseWei: purchaseWei.toString(),
    rate: rate.toString(),
    startDelaySeconds: startDelay,
    durationSeconds: duration,
  },
  contracts: {},
  transactions: {},
  assertions: {},
};

function persist(status = manifest.status) {
  manifest.status = status;
  fs.writeFileSync(deploymentPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function deployContract(label, artifact, constructorArguments) {
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(...constructorArguments);
  const transaction = contract.deploymentTransaction();
  const receipt = await transaction.wait();
  const address = await contract.getAddress();
  const runtimeCode = await provider.getCode(address);
  assert(runtimeCode !== "0x", `${label} runtime bytecode is missing`);
  manifest.contracts[label] = {
    address,
    source: artifact.sourceName,
    contractName: artifact.contractName,
    constructorArguments: constructorArguments.map((value) => value.toString()),
    deployment: transactionEvidence(receipt),
    runtimeCodeHash: ethers.keccak256(runtimeCode),
  };
  persist();
  return contract;
}

persist();
const token = await deployContract("MockAETH", tokenArtifact, []);
const latestBlock = await provider.getBlock("latest");
assert(latestBlock, "Unable to read the latest Base Sepolia block");
const startTime = latestBlock.timestamp + startDelay;
const endTime = startTime + duration;

const successHardCap = purchaseWei;
const successFunding = successHardCap * rate;
const refundHardCap = purchaseWei * 2n;
const refundFunding = refundHardCap * rate;

const successPresale = await deployContract("SuccessPresale", presaleArtifact, [
  await token.getAddress(),
  rate,
  successHardCap,
  successHardCap,
  purchaseWei,
  purchaseWei,
  startTime,
  endTime,
  treasury,
]);
const refundPresale = await deployContract("RefundPresale", presaleArtifact, [
  await token.getAddress(),
  rate,
  refundHardCap,
  refundHardCap,
  purchaseWei,
  refundHardCap,
  startTime,
  endTime,
  treasury,
]);
const staking = await deployContract("AetheronStaking", stakingArtifact, [await token.getAddress()]);

for (const [label, contract, amount] of [
  ["fundSuccessPresale", successPresale, successFunding],
  ["fundRefundPresale", refundPresale, refundFunding],
]) {
  const tx = await token.transfer(await contract.getAddress(), amount);
  manifest.transactions[label] = transactionEvidence(await tx.wait());
  persist();
}

const stakeAmount = ethers.parseUnits("100", 18);
const rewardAmount = ethers.parseUnits("1000", 18);
let tx = await token.approve(await staking.getAddress(), stakeAmount + rewardAmount);
manifest.transactions.approveStaking = transactionEvidence(await tx.wait());
tx = await staking.depositRewards(rewardAmount);
manifest.transactions.depositStakingRewards = transactionEvidence(await tx.wait());

await waitUntil(provider, startTime);

const nonOwner = ethers.Wallet.createRandom().address;
manifest.assertions.nonOwnerCancelRejected = await expectRevert(
  "non-owner presale cancellation",
  () =>
    provider.call({
      to: successPresale.target,
      from: nonOwner,
      data: successPresale.interface.encodeFunctionData("cancel"),
    })
);
manifest.assertions.nonOwnerPoolUpdateRejected = await expectRevert(
  "non-owner staking pool update",
  () =>
    provider.call({
      to: staking.target,
      from: nonOwner,
      data: staking.interface.encodeFunctionData("updatePoolStatus", [0, false]),
    })
);

// Successful sale path: buy -> finalize at hard cap -> claim -> treasury withdrawal.
tx = await successPresale.buyTokens({ value: purchaseWei });
manifest.transactions.successBuy = transactionEvidence(await tx.wait());
assert((await successPresale.weiRaised()) === successHardCap, "Successful sale hard cap was not reached");
tx = await successPresale.finalize();
manifest.transactions.successFinalize = transactionEvidence(await tx.wait());
const tokenBalanceBeforeClaim = await token.balanceOf(wallet.address);
tx = await successPresale.claimTokens();
manifest.transactions.successClaim = transactionEvidence(await tx.wait());
const tokenBalanceAfterClaim = await token.balanceOf(wallet.address);
assert(tokenBalanceAfterClaim - tokenBalanceBeforeClaim === successFunding, "Claimed token amount is incorrect");
tx = await successPresale.withdrawFunds();
manifest.transactions.successWithdraw = transactionEvidence(await tx.wait());
assert((await provider.getBalance(successPresale.target)) === 0n, "Successful sale retained ETH after withdrawal");

// Refund path: buy below hard cap -> cancel -> contributor pulls refund.
const walletEthBeforeRefundPurchase = await provider.getBalance(wallet.address);
tx = await refundPresale.buyTokens({ value: purchaseWei });
manifest.transactions.refundBuy = transactionEvidence(await tx.wait());
tx = await refundPresale.cancel();
manifest.transactions.refundCancel = transactionEvidence(await tx.wait());
assert(await refundPresale.refundsAvailable(), "Refunds are not available after cancellation");
tx = await refundPresale.claimRefund();
manifest.transactions.refundClaim = transactionEvidence(await tx.wait());
assert((await refundPresale.contributions(wallet.address)) === 0n, "Refund did not clear the contribution");
assert((await provider.getBalance(refundPresale.target)) === 0n, "Refund sale retained contributor ETH");
const walletEthAfterRefund = await provider.getBalance(wallet.address);
manifest.assertions.refundReturnedPrincipal =
  walletEthAfterRefund > walletEthBeforeRefundPurchase - purchaseWei;

// Staking path: stake -> verify normal lock -> emergency unstake.
tx = await staking.stake(0, stakeAmount);
manifest.transactions.stake = transactionEvidence(await tx.wait());
assert((await staking.getUserStakesCount(wallet.address)) === 1n, "Stake record was not created");
manifest.assertions.earlyUnstakeRejected = await expectRevert("early unstake", () => staking.unstake.staticCall(0));
tx = await staking.emergencyUnstake(0);
manifest.transactions.emergencyUnstake = transactionEvidence(await tx.wait());
assert((await staking.getUserStakesCount(wallet.address)) === 0n, "Emergency unstake did not clear the stake");
assert((await staking.totalStaked()) === 0n, "Emergency unstake did not clear totalStaked");

manifest.assertions = {
  ...manifest.assertions,
  successFinalized: await successPresale.finalized(),
  successWeiRaised: (await successPresale.weiRaised()).toString(),
  successTokensClaimed: (await successPresale.tokensOwed(wallet.address)) === 0n,
  refundCancelled: await refundPresale.cancelled(),
  refundContributionCleared: (await refundPresale.contributions(wallet.address)) === 0n,
  stakingEmergencyExitCleared: (await staking.getUserStakesCount(wallet.address)) === 0n,
};
manifest.status = "verified-rehearsal-awaiting-source-verification";
manifest.completedAt = new Date().toISOString();
persist();

const digest = crypto.createHash("sha256").update(fs.readFileSync(deploymentPath)).digest("hex");
console.log(JSON.stringify({
  rehearsal: "passed",
  manifestPath: deploymentPath,
  manifestSha256: digest,
  contracts: Object.fromEntries(
    Object.entries(manifest.contracts).map(([name, value]) => [name, value.address])
  ),
}, null, 2));
