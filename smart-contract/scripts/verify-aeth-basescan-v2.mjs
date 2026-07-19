import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ override: true });

const CHAIN_ID = "8453";
const TOKEN_ADDRESS = ethers.getAddress(
  process.env.AETH_TOKEN_ADDRESS || "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e"
);
const API_URL = "https://api.etherscan.io/v2/api";
const API_KEY = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const CONTRACT_BASENAME = "Aetheron";

if (!API_KEY) {
  throw new Error("ETHERSCAN_API_KEY or BASESCAN_API_KEY is required");
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const smartContractDir = path.resolve(scriptDir, "..");
const buildInfoDir = path.join(smartContractDir, "artifacts", "build-info");
const deploymentPath = path.join(smartContractDir, "deployments", "aeth-base.json");
if (!fs.existsSync(buildInfoDir)) throw new Error("Hardhat build-info is missing; run npm run compile first");

async function api(values, method = "GET") {
  const params = new URLSearchParams({ apikey: API_KEY, chainid: CHAIN_ID, ...values });
  const response = method === "POST"
    ? await fetch(`${API_URL}?chainid=${CHAIN_ID}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: params
      })
    : await fetch(`${API_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`Etherscan HTTP ${response.status}`);
  return response.json();
}

function loadBuildInfo() {
  for (const file of fs.readdirSync(buildInfoDir).filter((name) => name.endsWith(".json"))) {
    const candidate = JSON.parse(fs.readFileSync(path.join(buildInfoDir, file), "utf8"));
    const output = candidate.output || (file.endsWith(".output.json") ? candidate : undefined);
    const sourceName = Object.keys(output?.contracts || {}).find(
      (name) => output.contracts[name]?.[CONTRACT_BASENAME]
    );
    if (!sourceName) continue;

    let metadata = candidate;
    if (!candidate.input && file.endsWith(".output.json")) {
      const metadataPath = path.join(buildInfoDir, file.replace(/\.output\.json$/, ".json"));
      if (fs.existsSync(metadataPath)) metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    }
    if (!metadata.input) continue;
    return {
      input: metadata.input,
      compilerVersion: `v${metadata.solcLongVersion || metadata.solcVersion}`,
      contractName: `${sourceName}:${CONTRACT_BASENAME}`
    };
  }
  throw new Error("Unable to locate Aetheron in Hardhat build-info");
}

const provider = new ethers.JsonRpcProvider(RPC_URL, 8453, {
  staticNetwork: true,
  batchMaxCount: 1
});
const code = await provider.getCode(TOKEN_ADDRESS);
if (code === "0x") throw new Error(`No contract is deployed at ${TOKEN_ADDRESS}`);

const creation = await api({
  module: "contract",
  action: "getcontractcreation",
  contractaddresses: TOKEN_ADDRESS
});
const creationRecord = creation.result?.[0];
const creationTxHash = creationRecord?.txHash;
if (creation.status !== "1" || !creationTxHash) {
  throw new Error(`Could not resolve token creation transaction: ${creation.result || creation.message}`);
}

const creationTx = await provider.getTransaction(creationTxHash);
if (!creationTx?.data || creationTx.data.length < 194) {
  throw new Error("Creation transaction input is missing or too short");
}

// Aetheron's constructor contains exactly three static address arguments.
const constructorArguments = creationTx.data.slice(-192).toLowerCase();
const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
  ["address", "address", "address"],
  `0x${constructorArguments}`
).map((value) => ethers.getAddress(value));
if (decoded.some((value) => value === ethers.ZeroAddress)) {
  throw new Error("Creation transaction contains a zero constructor address");
}

const build = loadBuildInfo();
const submission = await api({
  module: "contract",
  action: "verifysourcecode",
  contractaddress: TOKEN_ADDRESS,
  sourceCode: JSON.stringify(build.input),
  codeformat: "solidity-standard-json-input",
  contractname: build.contractName,
  compilerversion: build.compilerVersion,
  optimizationUsed: build.input.settings?.optimizer?.enabled ? "1" : "0",
  runs: String(build.input.settings?.optimizer?.runs || 200),
  constructorArguments,
  evmversion: build.input.settings?.evmVersion || "default",
  licenseType: "3"
}, "POST");

if (submission.status === "1") {
  const guid = submission.result;
  let verified = false;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const status = await api({ module: "contract", action: "checkverifystatus", guid });
    const result = String(status.result || status.message || "");
    console.log(`Verification attempt ${attempt}: ${result}`);
    if (/pass - verified/i.test(result)) {
      verified = true;
      break;
    }
    if (!/pending in queue/i.test(result)) throw new Error(`BaseScan verification failed: ${result}`);
  }
  if (!verified) throw new Error("BaseScan verification did not complete before timeout");
} else if (!/already verified/i.test(String(submission.result || submission.message || ""))) {
  throw new Error(`BaseScan verification submission failed: ${submission.result || submission.message}`);
}

const sourceCheck = await api({
  module: "contract",
  action: "getsourcecode",
  address: TOKEN_ADDRESS
});
const verifiedRecord = sourceCheck.result?.[0];
if (sourceCheck.status !== "1" || !verifiedRecord?.SourceCode) {
  throw new Error("BaseScan source-code readback did not confirm verification");
}
const readbackArgs = String(verifiedRecord.ConstructorArguments || "").replace(/^0x/i, "").toLowerCase();
if (readbackArgs !== constructorArguments) {
  throw new Error("BaseScan constructor arguments do not match the creation transaction");
}

const token = new ethers.Contract(TOKEN_ADDRESS, [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function tradingEnabled() view returns (bool)"
], provider);
const [name, symbol, decimals, totalSupply, owner, tradingEnabled] = await Promise.all([
  token.name(), token.symbol(), token.decimals(), token.totalSupply(), token.owner(), token.tradingEnabled()
]);
if (name !== "Aetheron" || symbol !== "AETH" || decimals !== 18n) {
  throw new Error(`Unexpected token identity: ${name} ${symbol} decimals=${decimals}`);
}

const record = {
  schemaVersion: 1,
  network: "Base Mainnet",
  chainId: 8453,
  token: {
    address: TOKEN_ADDRESS,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupplyWei: totalSupply.toString(),
    totalSupplyTokens: ethers.formatUnits(totalSupply, decimals),
    owner: ethers.getAddress(owner),
    tradingEnabled
  },
  deployment: {
    creationTransaction: creationTxHash,
    creator: creationRecord.contractCreator ? ethers.getAddress(creationRecord.contractCreator) : null,
    constructorWallets: {
      team: decoded[0],
      marketing: decoded[1],
      stakingPool: decoded[2]
    }
  },
  verification: {
    explorer: "BaseScan",
    api: "Etherscan V2",
    verified: true,
    verifiedAt: new Date().toISOString(),
    contractName: build.contractName,
    compilerVersion: build.compilerVersion,
    constructorArguments,
    url: `https://basescan.org/address/${TOKEN_ADDRESS}#code`
  }
};
fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
fs.writeFileSync(deploymentPath, `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify(record, null, 2));
