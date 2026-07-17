import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ override: true });

const CHAIN_ID = "8453";
const CONTRACT_NAME = "contracts/AetheronPresale.sol:AetheronPresaleV2";
const API_URL = "https://api.etherscan.io/v2/api";
const API_KEY = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY;

if (!API_KEY) {
  throw new Error("ETHERSCAN_API_KEY or BASESCAN_API_KEY is required for Base mainnet source verification");
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const smartContractDir = path.resolve(scriptDir, "..");
const deploymentPath = path.join(smartContractDir, "deployments", "presale-base.json");
const buildInfoDir = path.join(smartContractDir, "artifacts", "build-info");

if (!fs.existsSync(deploymentPath)) throw new Error("Base presale deployment record is missing");
if (!fs.existsSync(buildInfoDir)) throw new Error("Hardhat build-info is missing; run npm run compile first");

const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const presaleAddress = deployment.contracts?.Presale?.address;
const tokenAddress = deployment.contracts?.Aetheron?.address;
const treasuryAddress = deployment.wallets?.treasury;
const parameters = deployment.parameters || {};

for (const [name, value] of Object.entries({ presaleAddress, tokenAddress, treasuryAddress })) {
  if (!ethers.isAddress(value || "")) throw new Error(`${name} is missing or invalid in presale-base.json`);
}

const requiredParameterNames = [
  "rate",
  "softCapWei",
  "hardCapWei",
  "minContributionWei",
  "maxContributionWei",
  "startTime",
  "endTime"
];
for (const name of requiredParameterNames) {
  if (parameters[name] === undefined || parameters[name] === null || parameters[name] === "") {
    throw new Error(`Deployment parameter ${name} is missing`);
  }
}

const buildInfoFiles = fs.readdirSync(buildInfoDir).filter((name) => name.endsWith(".json"));
let buildInfo;
for (const file of buildInfoFiles) {
  const candidate = JSON.parse(fs.readFileSync(path.join(buildInfoDir, file), "utf8"));
  if (candidate.output?.contracts?.["contracts/AetheronPresale.sol"]?.AetheronPresaleV2) {
    buildInfo = candidate;
    break;
  }
}
if (!buildInfo) throw new Error("Unable to locate AetheronPresaleV2 in Hardhat build-info");

const compilerVersion = `v${buildInfo.solcLongVersion || buildInfo.solcVersion}`;
const constructorArguments = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "address"],
  [
    tokenAddress,
    BigInt(parameters.rate),
    BigInt(parameters.softCapWei),
    BigInt(parameters.hardCapWei),
    BigInt(parameters.minContributionWei),
    BigInt(parameters.maxContributionWei),
    BigInt(parameters.startTime),
    BigInt(parameters.endTime),
    treasuryAddress
  ]
).slice(2);

async function etherscanRequest(values, method = "POST") {
  const params = new URLSearchParams({
    apikey: API_KEY,
    chainid: CHAIN_ID,
    ...values
  });

  const response = method === "GET"
    ? await fetch(`${API_URL}?${params.toString()}`, { method: "GET" })
    : await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: params
      });

  if (!response.ok) throw new Error(`Etherscan HTTP ${response.status}`);
  return response.json();
}

const submission = await etherscanRequest({
  module: "contract",
  action: "verifysourcecode",
  contractaddress: presaleAddress,
  sourceCode: JSON.stringify(buildInfo.input),
  codeformat: "solidity-standard-json-input",
  contractname: CONTRACT_NAME,
  compilerversion: compilerVersion,
  optimizationUsed: buildInfo.input.settings?.optimizer?.enabled ? "1" : "0",
  runs: String(buildInfo.input.settings?.optimizer?.runs || 200),
  constructorArguments,
  evmversion: buildInfo.input.settings?.evmVersion || "default",
  licenseType: "3"
});

if (submission.status !== "1") {
  const text = String(submission.result || submission.message || "Unknown verification submission error");
  if (!/already verified/i.test(text)) throw new Error(`BaseScan verification submission failed: ${text}`);
  console.log("BaseScan reports the contract is already verified.");
} else {
  const guid = submission.result;
  console.log(`BaseScan verification GUID: ${guid}`);

  let verified = false;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const status = await etherscanRequest({
      module: "contract",
      action: "checkverifystatus",
      guid
    });
    const result = String(status.result || status.message || "");
    console.log(`Verification attempt ${attempt}: ${result}`);
    if (/pass - verified/i.test(result)) {
      verified = true;
      break;
    }
    if (!/pending in queue/i.test(result)) {
      throw new Error(`BaseScan verification failed: ${result}`);
    }
  }
  if (!verified) throw new Error("BaseScan verification did not complete before timeout");
}

const sourceCheck = await etherscanRequest({
  module: "contract",
  action: "getsourcecode",
  address: presaleAddress
}, "GET");
const verifiedRecord = sourceCheck.result?.[0];
if (sourceCheck.status !== "1" || !verifiedRecord?.SourceCode) {
  throw new Error("BaseScan source-code readback did not confirm verification");
}

const readbackConstructorArguments = String(verifiedRecord.ConstructorArguments || "")
  .replace(/^0x/i, "")
  .toLowerCase();
if (readbackConstructorArguments !== constructorArguments.toLowerCase()) {
  throw new Error("BaseScan constructor-argument readback does not match the deployment record");
}

deployment.verification = {
  explorer: "BaseScan",
  api: "Etherscan V2",
  chainId: 8453,
  verified: true,
  verifiedAt: new Date().toISOString(),
  contractName: CONTRACT_NAME,
  compilerVersion,
  constructorArguments,
  url: `https://basescan.org/address/${presaleAddress}#code`
};
deployment.status = "deployed-verified-awaiting-owner-smoke-purchase";
fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2) + "\n");

console.log(JSON.stringify({
  verified: true,
  presaleAddress,
  compilerVersion,
  constructorArguments,
  explorerUrl: deployment.verification.url
}, null, 2));
