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
  "function cancelled() view returns (bool)"
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
  const number = Number(value);
  return Number.isSafeInteger(number) ? new Date(number * 1000).toISOString() : String(value);
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

  const [
    linkedToken,
    treasury,
    owner,
    rate,
    weiRaised,
    tokensReserved,
    softCap,
    hardCap,
    minContribution,
    maxContribution,
    startTime,
    endTime,
    finalized,
    cancelled,
    nativeBalance,
    expectedTokenBalance,
    expectedTokenTaxExcluded
  ] = await Promise.all([
    presale.token(),
    presale.treasury(),
    presale.owner(),
    presale.rate(),
    presale.weiRaised(),
    presale.tokensReserved(),
    presale.softCap(),
    presale.hardCap(),
    presale.minContribution(),
    presale.maxContribution(),
    presale.startTime(),
    presale.endTime(),
    presale.finalized(),
    presale.cancelled(),
    provider.getBalance(address),
    expectedToken.token.balanceOf(address),
    expectedToken.token.isExcludedFromTax(address)
  ]);

  const linkedTokenCode = await provider.getCode(linkedToken);
  let linkedTokenMetadata = null;
  if (linkedTokenCode !== "0x") {
    const linkedTokenContract = new ethers.Contract(linkedToken, TOKEN_ABI, provider);
    try {
      const [name, symbol, decimals, balance] = await Promise.all([
        linkedTokenContract.name(),
        linkedTokenContract.symbol(),
        linkedTokenContract.decimals(),
        linkedTokenContract.balanceOf(address)
      ]);
      linkedTokenMetadata = {
        name,
        symbol,
        decimals: Number(decimals),
        presaleBalance: ethers.formatUnits(balance, decimals)
      };
    } catch (error) {
      linkedTokenMetadata = { metadataReadError: error.shortMessage || error.message };
    }
  }

  const now = BigInt((await provider.getBlock("latest")).timestamp);
  return {
    address,
    bytecodeBytes: (code.length - 2) / 2,
    linkedToken,
    linkedTokenMatchesExpected: linkedToken.toLowerCase() === expectedTokenAddress.toLowerCase(),
    linkedTokenBytecodeBytes: linkedTokenCode === "0x" ? 0 : (linkedTokenCode.length - 2) / 2,
    linkedTokenMetadata,
    owner,
    treasury,
    rate: rate.toString(),
    weiRaised: ethers.formatEther(weiRaised),
    nativeBalance: ethers.formatEther(nativeBalance),
    softCap: ethers.formatEther(softCap),
    hardCap: ethers.formatEther(hardCap),
    minContribution: ethers.formatEther(minContribution),
    maxContribution: ethers.formatEther(maxContribution),
    startTime: isoTimestamp(startTime),
    endTime: isoTimestamp(endTime),
    finalized,
    cancelled,
    saleLive: now >= startTime && now <= endTime && !finalized && !cancelled,
    tokensReserved: ethers.formatUnits(tokensReserved, expectedToken.decimals),
    expectedTokenBalance: ethers.formatUnits(expectedTokenBalance, expectedToken.decimals),
    expectedTokenTaxExcluded
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

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    rpcUrl,
    chainId: network.chainId.toString(),
    latestBlock: latestBlock.number,
    latestBlockTime: isoTimestamp(latestBlock.timestamp),
    deploymentStatus: deployment.status,
    launchable: false,
    token: tokenReport,
    invalidPresale
  }, null, 2));

  throw new Error("No valid active Base presale is configured. The replacement deployment is still required.");
}

const presale = await inspectPresale(activePresaleAddress, expectedToken);
requireCondition(presale.linkedTokenMatchesExpected, "Presale token() does not match the configured Base AETH token");
requireCondition(BigInt(presale.rate) > 0n, "Presale rate must be positive");
requireCondition(Number(presale.softCap) > 0 && Number(presale.softCap) <= Number(presale.hardCap), "Presale cap configuration is invalid");
requireCondition(Number(presale.minContribution) > 0 && Number(presale.minContribution) <= Number(presale.maxContribution), "Contribution limits are invalid");
requireCondition(Number(presale.weiRaised) <= Number(presale.hardCap), "weiRaised exceeds the configured hard cap");
requireCondition(presale.expectedTokenTaxExcluded, "Presale address is not excluded from AETH transfer tax");

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
  launchable: deployment.launchable !== false && fullyFundedForHardCap,
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
