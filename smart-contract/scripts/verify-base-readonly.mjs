import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const deploymentPath = resolve(__dirname, "../deployments/presale-base.json");
const deployment = JSON.parse(await fs.readFile(deploymentPath, "utf8"));

const tokenAddress = deployment?.contracts?.Aetheron?.address;
const presaleAddress = deployment?.contracts?.Presale?.address;

if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(presaleAddress)) {
  throw new Error("presale-base.json contains an invalid token or presale address");
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

const network = await provider.getNetwork();
requireCondition(network.chainId === 8453n, `Expected Base chain 8453, received ${network.chainId}`);

const [tokenCode, presaleCode, block] = await Promise.all([
  provider.getCode(tokenAddress),
  provider.getCode(presaleAddress),
  provider.getBlock("latest")
]);
requireCondition(tokenCode !== "0x", "No bytecode exists at the configured AETH token address");
requireCondition(presaleCode !== "0x", "No bytecode exists at the configured presale address");
requireCondition(block, "Unable to read latest Base block");

const presale = new ethers.Contract(presaleAddress, PRESALE_ABI, provider);
const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

const [
  linkedToken,
  treasury,
  presaleOwner,
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
  presaleEthBalance,
  tokenName,
  tokenSymbol,
  tokenDecimals,
  totalSupply,
  tokenOwner,
  presaleTokenBalance,
  presaleTaxExcluded,
  tradingEnabled
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
  provider.getBalance(presaleAddress),
  token.name(),
  token.symbol(),
  token.decimals(),
  token.totalSupply(),
  token.owner(),
  token.balanceOf(presaleAddress),
  token.isExcludedFromTax(presaleAddress),
  token.tradingEnabled()
]);

requireCondition(linkedToken.toLowerCase() === tokenAddress.toLowerCase(), "Presale token() does not match presale-base.json");
requireCondition(rate > 0n, "Presale rate must be positive");
requireCondition(softCap > 0n && softCap <= hardCap, "Presale cap configuration is invalid");
requireCondition(minContribution > 0n && minContribution <= maxContribution, "Contribution limits are invalid");
requireCondition(startTime < endTime, "Presale schedule is invalid");
requireCondition(weiRaised <= hardCap, "weiRaised exceeds the configured hard cap");
requireCondition(presaleTokenBalance >= tokensReserved, "AETH inventory is below reserved-token liabilities");
requireCondition(presaleTaxExcluded, "Presale address is not excluded from AETH transfer tax");

const remainingWeiCapacity = hardCap > weiRaised ? hardCap - weiRaised : 0n;
const tokensNeededForFullHardCap = remainingWeiCapacity * rate;
const unreservedInventory = presaleTokenBalance - tokensReserved;
const fullyFundedForHardCap = unreservedInventory >= tokensNeededForFullHardCap;
const now = BigInt(block.timestamp);
const saleLive = now >= startTime && now <= endTime && !finalized && !cancelled;

const report = {
  checkedAt: new Date().toISOString(),
  rpcUrl,
  chainId: network.chainId.toString(),
  latestBlock: block.number,
  latestBlockTime: isoTimestamp(block.timestamp),
  contracts: {
    token: {
      address: tokenAddress,
      bytecodeBytes: (tokenCode.length - 2) / 2,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: Number(tokenDecimals),
      totalSupply: ethers.formatUnits(totalSupply, tokenDecimals),
      owner: tokenOwner,
      tradingEnabled
    },
    presale: {
      address: presaleAddress,
      bytecodeBytes: (presaleCode.length - 2) / 2,
      linkedToken,
      owner: presaleOwner,
      treasury,
      rate: rate.toString(),
      weiRaised: ethers.formatEther(weiRaised),
      nativeBalance: ethers.formatEther(presaleEthBalance),
      softCap: ethers.formatEther(softCap),
      hardCap: ethers.formatEther(hardCap),
      minContribution: ethers.formatEther(minContribution),
      maxContribution: ethers.formatEther(maxContribution),
      startTime: isoTimestamp(startTime),
      endTime: isoTimestamp(endTime),
      finalized,
      cancelled,
      saleLive,
      tokensReserved: ethers.formatUnits(tokensReserved, tokenDecimals),
      tokenInventory: ethers.formatUnits(presaleTokenBalance, tokenDecimals),
      unreservedInventory: ethers.formatUnits(unreservedInventory, tokenDecimals),
      tokensNeededForFullHardCap: ethers.formatUnits(tokensNeededForFullHardCap, tokenDecimals),
      fullyFundedForHardCap,
      taxExcluded: presaleTaxExcluded
    }
  }
};

console.log(JSON.stringify(report, null, 2));

if (!fullyFundedForHardCap) {
  throw new Error("Presale is solvent for current reservations but does not hold enough unreserved AETH to fill the remaining hard cap");
}
