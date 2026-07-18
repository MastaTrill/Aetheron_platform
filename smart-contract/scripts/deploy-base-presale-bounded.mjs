import fs from "node:fs";
import { ethers } from "ethers";

const INVALID_PRESALE = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
const DEFAULT_DEPLOY_GAS_LIMIT = 12_000_000n;
const MIN_DEPLOY_GAS_LIMIT = 1_000_000n;
const MAX_DEPLOY_GAS_LIMIT = 25_000_000n;
const deployGasLimit = BigInt(
  process.env.PRESALE_DEPLOY_GAS_LIMIT || DEFAULT_DEPLOY_GAS_LIMIT.toString()
);

if (deployGasLimit < MIN_DEPLOY_GAS_LIMIT || deployGasLimit > MAX_DEPLOY_GAS_LIMIT) {
  throw new Error(
    `PRESALE_DEPLOY_GAS_LIMIT must be between ${MIN_DEPLOY_GAS_LIMIT} and ${MAX_DEPLOY_GAS_LIMIT}`
  );
}

const deploymentUrl = new URL("../deployments/presale-base.json", import.meta.url);
const tokenAddress = (
  process.env.AETH_TOKEN_ADDRESS || "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e"
).toLowerCase();
const tokenInterface = new ethers.Interface([
  "function setExcludedFromTax(address,bool)",
  "function transfer(address,uint256) returns (bool)"
]);
const excludeSelector = tokenInterface.getFunction("setExcludedFromTax").selector.toLowerCase();
const transferSelector = tokenInterface.getFunction("transfer").selector.toLowerCase();

function describeError(error) {
  return error?.shortMessage || error?.reason || error?.message || String(error);
}

function preserveRecoveryEvidence(deployment) {
  deployment.contracts ||= {};
  deployment.contracts.InvalidPresale ||= { address: INVALID_PRESALE };
  deployment.replacesInvalidPresale ||= {
    address: INVALID_PRESALE,
    reason: "token() did not match the configured Base AETH token"
  };
  deployment.launchable = false;
  deployment.safety ||= {};
  deployment.safety.frontendEnabled = false;
  return deployment;
}

// The underlying deployment module writes the journal after each confirmed stage.
// Intercept only that one file so every partial write retains the invalid-presale
// recovery evidence and the public-launch safety flags.
const originalWriteFileSync = fs.writeFileSync.bind(fs);
fs.writeFileSync = function writeFileSyncPreservingEvidence(path, data, ...args) {
  if (String(path) === String(deploymentUrl) && typeof data === "string") {
    const deployment = preserveRecoveryEvidence(JSON.parse(data));
    data = JSON.stringify(deployment, null, 2) + "\n";
  }
  return originalWriteFileSync(path, data, ...args);
};

function persistBroadcast(kind, response, details = {}) {
  const evidence = {
    kind,
    hash: response.hash,
    from: response.from,
    to: response.to,
    nonce: response.nonce,
    gasLimit: response.gasLimit?.toString() || null,
    recordedAt: new Date().toISOString(),
    ...details
  };

  // Print the hash before touching the journal so it remains visible even if file persistence fails.
  console.log(JSON.stringify({ transactionBroadcast: evidence }, null, 2));

  try {
    const deployment = preserveRecoveryEvidence(
      JSON.parse(fs.readFileSync(deploymentUrl, "utf8"))
    );
    deployment.transactions ||= {};
    deployment.transactions[kind] = {
      ...(deployment.transactions[kind] || {}),
      hash: response.hash,
      nonce: response.nonce,
      status: "broadcast",
      gasLimit: response.gasLimit?.toString() || null,
      broadcastAt: evidence.recordedAt
    };

    if (kind === "deploy") {
      deployment.status = "presale-deployment-broadcast-awaiting-confirmation";
      deployment.contracts.Presale = {
        ...(deployment.contracts.Presale || {}),
        address: details.predictedAddress,
        deploymentTransactionHash: response.hash,
        deploymentBlockNumber: null
      };
    } else if (kind === "excludeFromTax") {
      deployment.status = "presale-deployed-tax-exclusion-broadcast-awaiting-confirmation";
    } else if (kind === "fund") {
      deployment.status = "presale-funding-broadcast-awaiting-confirmation";
    }

    deployment.updatedAt = new Date().toISOString();
    fs.writeFileSync(deploymentUrl, JSON.stringify(deployment, null, 2) + "\n");
  } catch (error) {
    throw new Error(`Broadcast ${kind} could not be journaled: ${describeError(error)}`);
  }
}

const originalEstimateGas = ethers.JsonRpcProvider.prototype.estimateGas;
ethers.JsonRpcProvider.prototype.estimateGas = async function estimateGasBounded(transaction) {
  const resolved = await ethers.resolveProperties(transaction || {});
  if (resolved.to === null || resolved.to === undefined) {
    console.log(
      JSON.stringify({
        boundedContractCreationGas: deployGasLimit.toString(),
        remoteCreationEstimateBypassed: true
      })
    );
    return deployGasLimit;
  }
  return originalEstimateGas.call(this, transaction);
};

const originalSendTransaction = ethers.Wallet.prototype.sendTransaction;
ethers.Wallet.prototype.sendTransaction = async function sendTransactionJournaled(transaction) {
  const resolved = await ethers.resolveProperties(transaction || {});
  const isCreation = resolved.to === null || resolved.to === undefined;
  const request =
    isCreation && resolved.gasLimit === undefined
      ? { ...transaction, gasLimit: deployGasLimit }
      : transaction;

  const response = await originalSendTransaction.call(this, request);

  if (isCreation) {
    const predictedAddress = ethers.getCreateAddress({
      from: response.from,
      nonce: response.nonce
    });
    persistBroadcast("deploy", response, { predictedAddress });
    return response;
  }

  const destination = typeof resolved.to === "string" ? resolved.to.toLowerCase() : "";
  const selector = typeof resolved.data === "string" ? resolved.data.slice(0, 10).toLowerCase() : "";
  if (destination === tokenAddress && selector === excludeSelector) {
    persistBroadcast("excludeFromTax", response);
  } else if (destination === tokenAddress && selector === transferSelector) {
    persistBroadcast("fund", response);
  }

  return response;
};

await import("./deploy-base-presale-production.mjs");
