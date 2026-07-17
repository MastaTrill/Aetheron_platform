import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const deploymentPath = resolve(__dirname, "../deployments/presale-base.json");
const deployment = JSON.parse(await fs.readFile(deploymentPath, "utf8"));

const expectedTokenAddress = deployment?.contracts?.Aetheron?.address;
const activePresaleAddress = deployment?.contracts?.Presale?.address;
const invalidPresaleAddress = deployment?.contracts?.InvalidPresale?.address;
const allowDisabledPresale = process.env.ALLOW_DISABLED_PRESALE === "true";

if (!ethers.isAddress(expectedTokenAddress)) {
  throw new Error("presale-base.json contains an invalid AETH token address");
}

const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const provider = new ethers.JsonRpcProvider(rpcUrl, 8453, {
  staticNetwork: true,
  batchMaxCount: 1
});

const PRESALE_ABI = [
  "function token() view returns (address)",
  "function treasury() view returns (address)",
  "function owner() view returns (address)",
  "function rate() view returns (uint256)",
  "function weiRaised() view returns (uint256)",
  "function tokensReserved() view returns (uint256)",
  "function softCap() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function maxContribution() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function finalized() view returns (bool)",
  "function cancelled() view returns (bool)",
  "function refundsAvailable() view returns (bool)"
];

const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
  "function isExcludedFromTax(address) view returns (bool)",
  "function tradingEnabled() view returns (bool)"
];

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function isoTimestamp(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? new Date(number * 1000).toISOString() : String(value);
}

function formatUnitsOrNull(value, decimals = 18) {
  if (value === null || value === undefined) return null;
  return ethers.formatUnits(value, decimals);
}

async function safeCall(contract, method, args = []) {
  try {
    return {
      supported: true,
      value: await contract[method](...args),
      error: null
    };
  } catch (error) {
    return {
      supported: false,
      value: null,
      error: error.shortMessage || error.reason || error.message
    };
  }
}

async function inspectExpectedToken() {
  const code = await provider.getCode(expectedTokenAddress);
  requireCondition(code !== "0x", "No bytecode exists at the configured AETH token address");

  const token = new ethers.Contract(expectedTokenAddress, TOKEN_ABI, provider);
  const [name, symbol, decimals, totalSupply, owner, tradingEnabled] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
    token.owner(),
    token.tradingEnabled()
  ]);

  return { token, code, name, symbol, decimals, totalSupply, owner, tradingEnabled };
}

async function inspectPresale(address, expectedToken) {
  requireCondition(ethers.isAddress(address), "Presale address is invalid");

  const code = await provider.getCode(address);
  requireCondition(code !== "0x", `No bytecode exists at presale ${address}`);
  const presale = new ethers.Contract(address, PRESALE_ABI, provider);

  const fields = Object.fromEntries(await Promise.all([
    "token",
    "treasury",
    "owner",
    "rate",
    "weiRaised",
    "tokensReserved",
    "softCap",
    "hardCap",
    "minContribution",
    "maxContribution",
    "startTime",
    "endTime",
    "finalized",
    "cancelled",
    "refundsAvailable"
  ].map(async (method) => [method, await safeCall(presale, method)])));

  requireCondition(fields.token.supported, "Presale does not expose token()");
  const linkedToken = fields.token.value;
  const [nativeBalance, expectedTokenBalance, expectedTokenTaxExcluded] = await Promise.all([
    provider.getBalance(address),
    expectedToken.token.balanceOf(address),
    expectedToken.token.isExcludedFromTax(address)
  ]);

  const linkedTokenCode = await provider.getCode(linkedToken);
  let linkedTokenMetadata = null;
  if (linkedTokenCode !== "0x") {
    const linkedTokenContract = new ethers.Contract(linkedToken, TOKEN_ABI, provider);
    const [name, symbol, decimals, balance] = await Promise.all([
      safeCall(linkedTokenContract, "name"),
      safeCall(linkedTokenContract, "symbol"),
      safeCall(linkedTokenContract, "decimals"),
      safeCall(linkedTokenContract, "balanceOf", [address])
    ]);

    linkedTokenMetadata = {
      name: name.value,
      symbol: symbol.value,
      decimals: decimals.value === null ? null : Number(decimals.value),
      presaleBalance:
        balance.value === null || decimals.value === null
          ? null
          : ethers.formatUnits(balance.value, decimals.value),
      unsupportedCalls: Object.fromEntries(
        Object.entries({ name, symbol, decimals, balanceOf: balance })
          .filter(([, result]) => !result.supported)
          .map(([key, result]) => [key, result.error])
      )
    };
  }

  const latestBlock = await provider.getBlock("latest");
  const now = BigInt(latestBlock.timestamp);
  const startTime = fields.startTime.value;
  const endTime = fields.endTime.value;
  const finalized = fields.finalized.value;
  const cancelled = fields.cancelled.value;

  return {
    address,
    bytecodeBytes: (code.length - 2) / 2,
    linkedToken,
    linkedTokenMatchesExpected: linkedToken.toLowerCase() === expectedTokenAddress.toLowerCase(),
    linkedTokenBytecodeBytes: linkedTokenCode === "0x" ? 0 : (linkedTokenCode.length - 2) / 2,
    linkedTokenMetadata,
    owner: fields.owner.value,
    treasury: fields.treasury.value,
    rate: fields.rate.value === null ? null : fields.rate.value.toString(),
    weiRaised: formatUnitsOrNull(fields.weiRaised.value),
    nativeBalance: ethers.formatEther(nativeBalance),
    softCap: formatUnitsOrNull(fields.softCap.value),
    hardCap: formatUnitsOrNull(fields.hardCap.value),
    minContribution: formatUnitsOrNull(fields.minContribution.value),
    maxContribution: formatUnitsOrNull(fields.maxContribution.value),
    startTime: isoTimestamp(startTime),
    endTime: isoTimestamp(endTime),
    finalized,
    cancelled,
    refundsAvailable: fields.refundsAvailable.value,
    saleLive:
      startTime !== null &&
      endTime !== null &&
      finalized !== null &&
      cancelled !== null
        ? now >= startTime && now <= endTime && !finalized && !cancelled
        : null,
    tokensReserved: formatUnitsOrNull(fields.tokensReserved.value, expectedToken.decimals),
    expectedTokenBalance: ethers.formatUnits(expectedTokenBalance, expectedToken.decimals),
    expectedTokenTaxExcluded,
    unsupportedCalls: Object.fromEntries(
      Object.entries(fields)
        .filter(([, result]) => !result.supported)
        .map(([method, result]) => [method, result.error])
    )
  };
}

const network = await provider.getNetwork();
requireCondition(network.chainId === 8453n, `Expected Base chain 8453, received ${network.chainId}`);
const latestBlock = await provider.getBlock("latest");
requireCondition(latestBlock, "Unable to read latest Base block");

const expectedToken = await inspectExpectedToken();
const tokenReport = {
  address: expectedTokenAddress,
  bytecodeBytes: (expectedToken.code.length - 2) / 2,
  name: expectedToken.name,
  symbol: expectedToken.symbol,
  decimals: Number(expectedToken.decimals),
  totalSupply: ethers.formatUnits(expectedToken.totalSupply, expectedToken.decimals),
  owner: expectedToken.owner,
  tradingEnabled: expectedToken.tradingEnabled
};

if (!ethers.isAddress(activePresaleAddress)) {
  const invalidPresale = ethers.isAddress(invalidPresaleAddress)
    ? await inspectPresale(invalidPresaleAddress, expectedToken)
    : null;

  requireCondition(invalidPresale, "No active presale and no invalid presale evidence is recorded");
  requireCondition(
    !invalidPresale.linkedTokenMatchesExpected,
    "Deployment is marked invalid, but the recorded presale now links to the expected token"
  );
  requireCondition(deployment.launchable === false, "Disabled deployment record must set launchable=false");

  const report = {
    checkedAt: new Date().toISOString(),
    rpcUrl,
    chainId: network.chainId.toString(),
    latestBlock: latestBlock.number,
    latestBlockTime: isoTimestamp(latestBlock.timestamp),
    deploymentStatus: deployment.status,
    launchReady: false,
    safeDisabledState: true,
    token: tokenReport,
    invalidPresale
  };
  console.log(JSON.stringify(report, null, 2));

  if (allowDisabledPresale) {
    console.log("SAFE_DISABLED_STATE: invalid presale is documented and no active frontend presale is configured.");
    process.exit(0);
  }

  throw new Error("No valid active Base presale is configured. Replacement deployment is required.");
}

const presale = await inspectPresale(activePresaleAddress, expectedToken);
requireCondition(presale.linkedTokenMatchesExpected, "Presale token() does not match the configured Base AETH token");
requireCondition(presale.rate !== null && BigInt(presale.rate) > 0n, "Presale rate must be positive");
requireCondition(presale.softCap !== null && presale.hardCap !== null, "Presale cap getters are required");
requireCondition(Number(presale.softCap) > 0 && Number(presale.softCap) <= Number(presale.hardCap), "Presale cap configuration is invalid");
requireCondition(presale.minContribution !== null && presale.maxContribution !== null, "Contribution limit getters are required");
requireCondition(Number(presale.minContribution) > 0 && Number(presale.minContribution) <= Number(presale.maxContribution), "Contribution limits are invalid");
requireCondition(presale.weiRaised !== null && Number(presale.weiRaised) <= Number(presale.hardCap), "weiRaised exceeds the configured hard cap");
requireCondition(presale.expectedTokenTaxExcluded, "Presale address is not excluded from AETH transfer tax");
requireCondition(presale.tokensReserved !== null, "Active presale must expose tokensReserved()");

const inventoryUnits = ethers.parseUnits(presale.expectedTokenBalance, expectedToken.decimals);
const reservedUnits = ethers.parseUnits(presale.tokensReserved, expectedToken.decimals);
requireCondition(inventoryUnits >= reservedUnits, "AETH inventory is below reserved-token liabilities");
const hardCapUnits = ethers.parseEther(presale.hardCap);
const raisedUnits = ethers.parseEther(presale.weiRaised);
const remainingWeiCapacity = hardCapUnits > raisedUnits ? hardCapUnits - raisedUnits : 0n;
const tokensNeededForFullHardCap = remainingWeiCapacity * BigInt(presale.rate);
const unreservedInventory = inventoryUnits - reservedUnits;
const fullyFundedForHardCap = unreservedInventory >= tokensNeededForFullHardCap;

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  rpcUrl,
  chainId: network.chainId.toString(),
  latestBlock: latestBlock.number,
  latestBlockTime: isoTimestamp(latestBlock.timestamp),
  deploymentStatus: deployment.status,
  launchReady: deployment.launchable !== false && fullyFundedForHardCap,
  safeDisabledState: false,
  token: tokenReport,
  presale: {
    ...presale,
    unreservedInventory: ethers.formatUnits(unreservedInventory, expectedToken.decimals),
    tokensNeededForFullHardCap: ethers.formatUnits(tokensNeededForFullHardCap, expectedToken.decimals),
    fullyFundedForHardCap
  }
}, null, 2));

if (!fullyFundedForHardCap) {
  throw new Error("Presale is solvent for current reservations but is not funded for the remaining hard cap");
}
if (deployment.launchable === false) {
  throw new Error("Deployment record is explicitly marked non-launchable");
}
