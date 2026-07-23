import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const CHAIN_ID = "84532";
const API_URL = "https://api.etherscan.io/v2/api";
const API_KEY = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY;
if (!API_KEY) throw new Error("ETHERSCAN_API_KEY or BASESCAN_API_KEY is required");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const smartContractDir = path.resolve(scriptDir, "..");
const deploymentPath = path.join(
  smartContractDir,
  "deployments",
  "base-sepolia-presale-rehearsal.json"
);
const buildInfoDir = path.join(smartContractDir, "artifacts", "build-info");
if (!fs.existsSync(deploymentPath)) throw new Error("Base Sepolia rehearsal manifest is missing");
if (!fs.existsSync(buildInfoDir)) throw new Error("Hardhat build-info is missing; run npm run compile first");

const manifest = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
if (manifest.chainId !== Number(CHAIN_ID)) throw new Error(`Expected rehearsal chain ${CHAIN_ID}`);
if (!String(manifest.status || "").startsWith("verified-rehearsal")) {
  throw new Error(`Rehearsal manifest is not ready for verification: ${manifest.status}`);
}

const buildInfoFiles = fs.readdirSync(buildInfoDir).filter((name) => name.endsWith(".json"));
const buildInfoCache = buildInfoFiles.map((file) => {
  const fullPath = path.join(buildInfoDir, file);
  const candidate = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  const output = candidate.output || (file.endsWith(".output.json") ? candidate : undefined);
  let metadata = candidate;
  if (!candidate.input && file.endsWith(".output.json")) {
    const metadataPath = path.join(buildInfoDir, file.replace(/\.output\.json$/, ".json"));
    if (fs.existsSync(metadataPath)) metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  }
  return metadata.input && output ? { ...metadata, output } : null;
}).filter(Boolean);

function findBuildInfo(contractName) {
  for (const buildInfo of buildInfoCache) {
    const sourceName = Object.keys(buildInfo.output?.contracts || {}).find(
      (name) => buildInfo.output.contracts[name]?.[contractName]
    );
    if (sourceName) return { buildInfo, sourceName };
  }
  throw new Error(`Unable to locate ${contractName} in Hardhat build-info`);
}

function constructorEncoding(label, record) {
  const args = record.constructorArguments || [];
  if (label === "MockAETH") return "";
  if (label === "AetheronStaking") {
    return ethers.AbiCoder.defaultAbiCoder().encode(["address"], args).slice(2);
  }
  if (label === "SuccessPresale" || label === "RefundPresale") {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "address"],
      [
        args[0],
        BigInt(args[1]),
        BigInt(args[2]),
        BigInt(args[3]),
        BigInt(args[4]),
        BigInt(args[5]),
        BigInt(args[6]),
        BigInt(args[7]),
        args[8],
      ]
    ).slice(2);
  }
  throw new Error(`Unsupported rehearsal contract label: ${label}`);
}

async function etherscanRequest(values, method = "POST") {
  const params = new URLSearchParams({ apikey: API_KEY, chainid: CHAIN_ID, ...values });
  const response = method === "GET"
    ? await fetch(`${API_URL}?${params.toString()}`)
    : await fetch(`${API_URL}?chainid=${CHAIN_ID}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: params,
      });
  if (!response.ok) throw new Error(`Etherscan HTTP ${response.status}`);
  return response.json();
}

async function verifyContract(label, record) {
  if (!ethers.isAddress(record.address || "")) throw new Error(`${label} address is invalid`);
  const contractName = record.contractName;
  const { buildInfo, sourceName } = findBuildInfo(contractName);
  const compilerVersion = `v${buildInfo.solcLongVersion || buildInfo.solcVersion}`;
  const constructorArguments = constructorEncoding(label, record);
  const fullyQualifiedName = `${sourceName}:${contractName}`;

  const submission = await etherscanRequest({
    module: "contract",
    action: "verifysourcecode",
    contractaddress: record.address,
    sourceCode: JSON.stringify(buildInfo.input),
    codeformat: "solidity-standard-json-input",
    contractname: fullyQualifiedName,
    compilerversion: compilerVersion,
    optimizationUsed: buildInfo.input.settings?.optimizer?.enabled ? "1" : "0",
    runs: String(buildInfo.input.settings?.optimizer?.runs || 200),
    constructorArguments,
    evmversion: buildInfo.input.settings?.evmVersion || "default",
    licenseType: "3",
  });

  if (submission.status !== "1") {
    const text = String(submission.result || submission.message || "Unknown verification error");
    if (!/already verified/i.test(text)) throw new Error(`${label} verification submission failed: ${text}`);
  } else {
    const guid = submission.result;
    let verified = false;
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const status = await etherscanRequest({
        module: "contract",
        action: "checkverifystatus",
        guid,
      });
      const result = String(status.result || status.message || "");
      console.log(`${label} verification attempt ${attempt}: ${result}`);
      if (/pass - verified/i.test(result)) {
        verified = true;
        break;
      }
      if (!/pending in queue/i.test(result)) throw new Error(`${label} verification failed: ${result}`);
    }
    if (!verified) throw new Error(`${label} verification did not complete before timeout`);
  }

  const sourceCheck = await etherscanRequest({
    module: "contract",
    action: "getsourcecode",
    address: record.address,
  }, "GET");
  const verifiedRecord = sourceCheck.result?.[0];
  if (sourceCheck.status !== "1" || !verifiedRecord?.SourceCode) {
    throw new Error(`${label} source-code readback did not confirm verification`);
  }
  const readbackArgs = String(verifiedRecord.ConstructorArguments || "").replace(/^0x/i, "").toLowerCase();
  if (readbackArgs !== constructorArguments.toLowerCase()) {
    throw new Error(`${label} constructor-argument readback differs from the manifest`);
  }

  return {
    explorer: "BaseScan Sepolia",
    api: "Etherscan V2",
    chainId: Number(CHAIN_ID),
    verified: true,
    verifiedAt: new Date().toISOString(),
    contractName: fullyQualifiedName,
    compilerVersion,
    constructorArguments,
    url: `https://sepolia.basescan.org/address/${record.address}#code`,
  };
}

for (const label of ["MockAETH", "SuccessPresale", "RefundPresale", "AetheronStaking"]) {
  const record = manifest.contracts?.[label];
  if (!record) throw new Error(`Manifest is missing ${label}`);
  record.verification = await verifyContract(label, record);
  fs.writeFileSync(deploymentPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

manifest.status = "verified-rehearsal";
manifest.sourceVerificationCompletedAt = new Date().toISOString();
fs.writeFileSync(deploymentPath, `${JSON.stringify(manifest, null, 2)}\n`);
const digest = crypto.createHash("sha256").update(fs.readFileSync(deploymentPath)).digest("hex");
console.log(JSON.stringify({
  sourceVerification: "passed",
  manifestPath: deploymentPath,
  manifestSha256: digest,
  explorerUrls: Object.fromEntries(
    Object.entries(manifest.contracts).map(([label, record]) => [label, record.verification.url])
  ),
}, null, 2));
