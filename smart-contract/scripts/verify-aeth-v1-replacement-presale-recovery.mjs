import fs from "node:fs";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  formatEther,
  formatUnits,
  getAddress,
} from "ethers";
import { readWithRetry } from "./lib/base-read-retry.mjs";

const MIGRATION_URL = new URL("../deployments/aeth-v2-migration.json", import.meta.url);
const PRESALE_DEPLOYMENT_URL = new URL("../deployments/presale-base.json", import.meta.url);
const SNAPSHOT_CONFIRMATIONS = 3;
const MULTICALL3_ADDRESS = getAddress("0xca11bde05977b3631167028862be2a173976ca11");

const ERC20_ABI = ["function balanceOf(address account) view returns (uint256)"];
const PRESALE_ABI = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function treasury() view returns (address)",
  "function weiRaised() view returns (uint256)",
  "function tokensReserved() view returns (uint256)",
  "function softCap() view returns (uint256)",
  "function finalized() view returns (bool)",
  "function cancelled() view returns (bool)",
  "function refundsAvailable() view returns (bool)",
  "function contributions(address account) view returns (uint256)",
  "function tokensOwed(address account) view returns (uint256)",
  "function refunded(address account) view returns (bool)",
  "function claimRefund()",
  "function withdrawUnsoldTokens()",
];
const MULTICALL3_ABI = [
  "function aggregate3((address target,bool allowFailure,bytes callData)[] calls) payable returns ((bool success,bytes returnData)[] returnData)",
];

function loadJson(url) {
  return JSON.parse(fs.readFileSync(url, "utf8"));
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function serialize(value) {
  return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
}

function requireCallResult(result, label) {
  if (!result?.success) throw new Error(`${label} failed in pinned-block multicall`);
  return result.returnData;
}

async function staticSimulation(call, label) {
  try {
    await readWithRetry(call, label, { validate: () => true });
    return { succeeded: true, error: null };
  } catch (error) {
    return { succeeded: false, error: error?.shortMessage || error?.message || String(error) };
  }
}

async function main() {
  const rpcUrl = process.env.BASE_RPC_URL?.trim();
  if (!rpcUrl) throw new Error("BASE_RPC_URL is required for read-only recovery verification");

  const migration = loadJson(MIGRATION_URL);
  const deployment = loadJson(PRESALE_DEPLOYMENT_URL);
  requireCondition(migration.chainId === 8453 && deployment.chainId === 8453, "Recovery records must target Base Mainnet chain 8453");

  const recoveryPlan = migration.migrationPlan?.replacementPresaleRecovery;
  requireCondition(recoveryPlan, "replacementPresaleRecovery is missing from migration manifest");

  const tokenAddress = getAddress(migration.canonicalToken.address);
  const presaleAddress = getAddress(recoveryPlan.address);
  const deploymentPresale = getAddress(deployment.contracts.Presale.address);
  const deploymentToken = getAddress(deployment.contracts.Aetheron.address);
  const owner = getAddress(deployment.wallets.owner);
  const treasury = getAddress(deployment.wallets.treasury);

  requireCondition(presaleAddress === deploymentPresale, "Migration and deployment presale addresses disagree");
  requireCondition(tokenAddress === deploymentToken, "Migration and deployment token addresses disagree");

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await readWithRetry(() => provider.getNetwork(), "Base network");
  requireCondition(Number(network.chainId) === 8453, `RPC chain mismatch: expected 8453, found ${network.chainId}`);

  const latestBlockNumber = await readWithRetry(() => provider.getBlockNumber(), "Base block number");
  const blockNumber = Math.max(latestBlockNumber - SNAPSHOT_CONFIRMATIONS, deployment.contracts.Presale.deploymentBlockNumber || 0);
  const pinnedBlock = await readWithRetry(
    () => provider.getBlock(blockNumber),
    `Base pinned block ${blockNumber}`,
    { validate: (value) => Boolean(value?.hash) },
  );

  const [tokenCode, presaleCode, multicallCode, presaleEthBalance] = await Promise.all([
    readWithRetry(() => provider.getCode(tokenAddress, blockNumber), "AETH V1 bytecode"),
    readWithRetry(() => provider.getCode(presaleAddress, blockNumber), "replacement presale bytecode"),
    readWithRetry(() => provider.getCode(MULTICALL3_ADDRESS, blockNumber), "Base Multicall3 bytecode"),
    readWithRetry(() => provider.getBalance(presaleAddress, blockNumber), "replacement presale ETH balance"),
  ]);
  requireCondition(tokenCode !== "0x", "Canonical V1 token bytecode missing at pinned block");
  requireCondition(presaleCode !== "0x", "Replacement presale bytecode missing at pinned block");
  requireCondition(multicallCode !== "0x", "Base Multicall3 bytecode missing at pinned block");

  const tokenInterface = new Interface(ERC20_ABI);
  const presaleInterface = new Interface(PRESALE_ABI);
  const callSpecs = [
    { target: presaleAddress, iface: presaleInterface, fn: "owner", args: [], label: "presale owner" },
    { target: presaleAddress, iface: presaleInterface, fn: "token", args: [], label: "presale token" },
    { target: presaleAddress, iface: presaleInterface, fn: "treasury", args: [], label: "presale treasury" },
    { target: presaleAddress, iface: presaleInterface, fn: "weiRaised", args: [], label: "weiRaised" },
    { target: presaleAddress, iface: presaleInterface, fn: "tokensReserved", args: [], label: "tokensReserved" },
    { target: presaleAddress, iface: presaleInterface, fn: "softCap", args: [], label: "softCap" },
    { target: presaleAddress, iface: presaleInterface, fn: "finalized", args: [], label: "finalized" },
    { target: presaleAddress, iface: presaleInterface, fn: "cancelled", args: [], label: "cancelled" },
    { target: presaleAddress, iface: presaleInterface, fn: "refundsAvailable", args: [], label: "refundsAvailable" },
    { target: presaleAddress, iface: presaleInterface, fn: "contributions", args: [owner], label: "owner contribution" },
    { target: presaleAddress, iface: presaleInterface, fn: "tokensOwed", args: [owner], label: "owner tokens owed" },
    { target: presaleAddress, iface: presaleInterface, fn: "refunded", args: [owner], label: "owner refunded" },
    { target: tokenAddress, iface: tokenInterface, fn: "balanceOf", args: [presaleAddress], label: "presale V1 inventory" },
  ];
  const calls = callSpecs.map((spec) => ({
    target: spec.target,
    allowFailure: true,
    callData: spec.iface.encodeFunctionData(spec.fn, spec.args),
  }));

  const multicall = new Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
  const results = await readWithRetry(
    () => multicall.aggregate3.staticCall(calls, { blockTag: blockNumber }),
    "replacement recovery pinned-block multicall",
    { validate: (value) => value?.length === calls.length },
  );
  const decoded = results.map((result, index) => {
    const spec = callSpecs[index];
    return spec.iface.decodeFunctionResult(spec.fn, requireCallResult(result, spec.label))[0];
  });

  const [
    presaleOwner,
    linkedToken,
    linkedTreasury,
    weiRaised,
    tokensReserved,
    softCap,
    finalized,
    cancelled,
    refundsAvailable,
    ownerContribution,
    ownerTokensOwed,
    ownerRefunded,
    inventory,
  ] = decoded;

  requireCondition(getAddress(presaleOwner) === owner, "Replacement presale owner does not match deployment record");
  requireCondition(getAddress(linkedToken) === tokenAddress, "Replacement presale token linkage is incorrect");
  requireCondition(getAddress(linkedTreasury) === treasury, "Replacement presale treasury linkage is incorrect");
  requireCondition(inventory >= tokensReserved, "Replacement presale inventory is below token liabilities");

  const expectedInventory = BigInt(recoveryPlan.snapshotBalanceTokens) * 10n ** 18n;
  const expectedReserved = BigInt(recoveryPlan.snapshotReservedTokens) * 10n ** 18n;
  requireCondition(inventory === expectedInventory, `Replacement presale V1 balance changed: expected ${expectedInventory}, found ${inventory}`);
  requireCondition(tokensReserved === expectedReserved, `Replacement presale reserved balance changed: expected ${expectedReserved}, found ${tokensReserved}`);

  const ownerOnlyContributorScopeVerified =
    weiRaised > 0n &&
    ownerContribution === weiRaised &&
    ownerTokensOwed === tokensReserved &&
    !ownerRefunded;
  const refundLiabilityCovered = presaleEthBalance >= ownerContribution;
  const currentUnsoldRecoverable = inventory - tokensReserved;
  const expectedUnsoldRecoverable = BigInt(recoveryPlan.snapshotUnsoldRecoverableTokens) * 10n ** 18n;
  requireCondition(currentUnsoldRecoverable === expectedUnsoldRecoverable, "Current unsold-token recovery amount no longer matches the prepared migration plan");
  requireCondition(weiRaised < softCap, "Replacement presale unexpectedly reached soft cap");

  const presale = new Contract(presaleAddress, PRESALE_ABI, provider);
  const claimRefundSimulation = await staticSimulation(
    () => presale.claimRefund.staticCall({ from: owner, blockTag: blockNumber }),
    "owner claimRefund static simulation",
  );
  const withdrawUnsoldSimulation = await staticSimulation(
    () => presale.withdrawUnsoldTokens.staticCall({ from: owner, blockTag: blockNumber }),
    "owner withdrawUnsoldTokens static simulation",
  );

  const refundExecutionStateReady =
    refundsAvailable &&
    !finalized &&
    ownerOnlyContributorScopeVerified &&
    refundLiabilityCovered &&
    claimRefundSimulation.succeeded;
  const currentUnsoldWithdrawalStateReady =
    (finalized || refundsAvailable) &&
    currentUnsoldRecoverable > 0n &&
    withdrawUnsoldSimulation.succeeded;
  const recoveryReadyForExplicitOwnerApproval = refundExecutionStateReady && currentUnsoldWithdrawalStateReady;
  const recommendedSequence = recoveryReadyForExplicitOwnerApproval
    ? [
        "owner_claimRefund_first",
        "verify_tokensReserved_is_zero_and_refund_receipt",
        "owner_withdrawUnsoldTokens_after_refund",
        "verify_presale_v1_balance_is_zero_before_v2_cutover",
      ]
    : ["do_not_execute_recovery_until_failed_readiness_checks_are_resolved"];

  const report = {
    checkedAt: new Date().toISOString(),
    chainId: Number(network.chainId),
    latestBlockNumber,
    snapshotConfirmations: SNAPSHOT_CONFIRMATIONS,
    blockNumber,
    blockHash: pinnedBlock.hash,
    tokenAddress,
    presaleAddress,
    owner,
    treasury,
    state: {
      finalized,
      cancelled,
      refundsAvailable,
      weiRaisedWei: weiRaised,
      weiRaisedEth: formatEther(weiRaised),
      softCapWei: softCap,
      presaleEthBalanceWei: presaleEthBalance,
      presaleEthBalanceEth: formatEther(presaleEthBalance),
      tokenInventoryWei: inventory,
      tokenInventoryTokens: formatUnits(inventory, 18),
      tokensReservedWei: tokensReserved,
      tokensReservedTokens: formatUnits(tokensReserved, 18),
      currentUnsoldRecoverableWei: currentUnsoldRecoverable,
      currentUnsoldRecoverableTokens: formatUnits(currentUnsoldRecoverable, 18),
      postRefundRecoverableWei: ownerOnlyContributorScopeVerified ? inventory : null,
      postRefundRecoverableTokens: ownerOnlyContributorScopeVerified ? formatUnits(inventory, 18) : null,
    },
    contributorEvidence: {
      ownerContributionWei: ownerContribution,
      ownerContributionEth: formatEther(ownerContribution),
      ownerTokensOwedWei: ownerTokensOwed,
      ownerTokensOwedTokens: formatUnits(ownerTokensOwed, 18),
      ownerRefunded,
      ownerOnlyContributorScopeVerified,
    },
    readiness: {
      refundLiabilityCovered,
      claimRefundStaticCallSucceeded: claimRefundSimulation.succeeded,
      claimRefundStaticCallError: claimRefundSimulation.error,
      withdrawUnsoldStaticCallSucceeded: withdrawUnsoldSimulation.succeeded,
      withdrawUnsoldStaticCallError: withdrawUnsoldSimulation.error,
      refundExecutionStateReady,
      currentUnsoldWithdrawalStateReady,
      recoveryReadyForExplicitOwnerApproval,
    },
    recommendedSequence,
    recoveryTransactionAuthorized: false,
    authorizationChanged: false,
    note: "Read-only and eth_call evidence only. No refund, token recovery, V2 deployment, liquidity, migration, or cutover transaction was submitted.",
  };

  const output = serialize(report);
  console.log(output);
  const outputPath = process.env.AETH_V1_RECOVERY_OUTPUT_PATH?.trim();
  if (outputPath) fs.writeFileSync(outputPath, `${output}\n`, "utf8");

  if (!recoveryReadyForExplicitOwnerApproval) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
