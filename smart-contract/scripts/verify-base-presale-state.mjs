import fs from "node:fs/promises";
import { ethers } from "ethers";

const deploymentUrl = new URL("../deployments/presale-base.json", import.meta.url);
const deployment = JSON.parse(await fs.readFile(deploymentUrl, "utf8"));
const activePresaleAddress = deployment.contracts?.Presale?.address;

// Preserve the detailed invalid-presale inspection before a replacement exists.
if (!ethers.isAddress(activePresaleAddress || "")) {
  await import("./verify-base-readonly.mjs");
  process.exit(0);
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedTokenAddress = deployment.contracts?.Aetheron?.address;
const expectedOwner = deployment.wallets?.owner;
const expectedTreasury = deployment.wallets?.treasury;
const parameters = deployment.parameters || {};

for (const [name, value] of Object.entries({
  expectedTokenAddress,
  activePresaleAddress,
  expectedOwner,
  expectedTreasury
})) {
  requireCondition(ethers.isAddress(value || ""), `${name} is missing or invalid in presale-base.json`);
}

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org", 8453, {
  staticNetwork: true,
  batchMaxCount: 1
});
const network = await provider.getNetwork();
requireCondition(network.chainId === 8453n, `Expected Base chain 8453, received ${network.chainId}`);

const TOKEN_ABI = [
  "function owner() view returns (address)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function isExcludedFromTax(address) view returns (bool)",
  "function tradingEnabled() view returns (bool)"
];
const PRESALE_ABI = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function treasury() view returns (address)",
  "function rate() view returns (uint256)",
  "function softCap() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function maxContribution() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function weiRaised() view returns (uint256)",
  "function tokensReserved() view returns (uint256)",
  "function cancelled() view returns (bool)",
  "function finalized() view returns (bool)"
];

const [tokenCode, presaleCode] = await Promise.all([
  provider.getCode(expectedTokenAddress),
  provider.getCode(activePresaleAddress)
]);
requireCondition(tokenCode !== "0x", "Approved AETH token has no Base bytecode");
requireCondition(presaleCode !== "0x", "Replacement presale has no Base bytecode");

const token = new ethers.Contract(expectedTokenAddress, TOKEN_ABI, provider);
const presale = new ethers.Contract(activePresaleAddress, PRESALE_ABI, provider);
const [
  tokenOwner,
  tokenDecimals,
  tradingEnabled,
  inventory,
  taxExcluded,
  presaleOwner,
  linkedToken,
  linkedTreasury,
  rate,
  softCap,
  hardCap,
  minimum,
  maximum,
  startTime,
  endTime,
  weiRaised,
  tokensReserved,
  cancelled,
  finalized,
  latestBlock
] = await Promise.all([
  token.owner(),
  token.decimals(),
  token.tradingEnabled(),
  token.balanceOf(activePresaleAddress),
  token.isExcludedFromTax(activePresaleAddress),
  presale.owner(),
  presale.token(),
  presale.treasury(),
  presale.rate(),
  presale.softCap(),
  presale.hardCap(),
  presale.minContribution(),
  presale.maxContribution(),
  presale.startTime(),
  presale.endTime(),
  presale.weiRaised(),
  presale.tokensReserved(),
  presale.cancelled(),
  presale.finalized(),
  provider.getBlock("latest")
]);

requireCondition(tokenDecimals === 18n, "AETH token decimals are not 18");
requireCondition(tokenOwner.toLowerCase() === expectedOwner.toLowerCase(), "AETH owner does not match the deployment record");
requireCondition(presaleOwner.toLowerCase() === expectedOwner.toLowerCase(), "Replacement presale owner does not match the deployment record");
requireCondition(linkedToken.toLowerCase() === expectedTokenAddress.toLowerCase(), "Replacement presale token linkage is incorrect");
requireCondition(linkedTreasury.toLowerCase() === expectedTreasury.toLowerCase(), "Replacement presale treasury linkage is incorrect");
requireCondition(taxExcluded, "Replacement presale is not excluded from AETH tax");

const exactChecks = {
  rate: [rate, parameters.rate],
  softCapWei: [softCap, parameters.softCapWei],
  hardCapWei: [hardCap, parameters.hardCapWei],
  minContributionWei: [minimum, parameters.minContributionWei],
  maxContributionWei: [maximum, parameters.maxContributionWei],
  startTime: [startTime, parameters.startTime],
  endTime: [endTime, parameters.endTime]
};
for (const [name, [actual, expected]] of Object.entries(exactChecks)) {
  requireCondition(expected !== undefined, `${name} is missing from the deployment record`);
  requireCondition(actual === BigInt(expected), `${name} does not match the deployment record`);
}

requireCondition(inventory >= tokensReserved, "AETH inventory is below reserved-token liabilities");
requireCondition(weiRaised <= hardCap, "weiRaised exceeds the hard cap");
const remainingWeiCapacity = hardCap - weiRaised;
const unreservedInventory = inventory - tokensReserved;
const tokensNeededForRemainingHardCap = remainingWeiCapacity * rate;
const fullyFundedForHardCap = unreservedInventory >= tokensNeededForRemainingHardCap;
requireCondition(fullyFundedForHardCap, "Replacement presale is not fully funded for the remaining hard cap");

const prelaunchDisabled = deployment.launchable === false;
if (prelaunchDisabled) {
  requireCondition(!cancelled && !finalized, "Prelaunch replacement is unexpectedly cancelled or finalized");
}

const now = BigInt(latestBlock.timestamp);
const saleLive = now >= startTime && now <= endTime && !cancelled && !finalized;
const report = {
  checkedAt: new Date().toISOString(),
  chainId: network.chainId.toString(),
  latestBlock: latestBlock.number,
  deploymentStatus: deployment.status,
  launchReady: deployment.launchable === true && fullyFundedForHardCap && !cancelled && !finalized,
  safeDisabledState: prelaunchDisabled && fullyFundedForHardCap,
  token: {
    address: expectedTokenAddress,
    owner: tokenOwner,
    decimals: Number(tokenDecimals),
    tradingEnabled
  },
  presale: {
    address: activePresaleAddress,
    owner: presaleOwner,
    token: linkedToken,
    treasury: linkedTreasury,
    rate: rate.toString(),
    weiRaised: ethers.formatEther(weiRaised),
    tokensReserved: ethers.formatUnits(tokensReserved, tokenDecimals),
    inventory: ethers.formatUnits(inventory, tokenDecimals),
    unreservedInventory: ethers.formatUnits(unreservedInventory, tokenDecimals),
    tokensNeededForRemainingHardCap: ethers.formatUnits(tokensNeededForRemainingHardCap, tokenDecimals),
    fullyFundedForHardCap,
    taxExcluded,
    cancelled,
    finalized,
    saleLive
  }
};

console.log(JSON.stringify(report, null, 2));
if (report.safeDisabledState) {
  console.log("SAFE_DISABLED_STATE: replacement is fully funded and verified while public purchase controls remain disabled.");
}
