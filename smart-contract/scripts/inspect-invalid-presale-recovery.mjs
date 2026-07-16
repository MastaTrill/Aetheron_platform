import fs from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const deployment = JSON.parse(
  await fs.readFile(resolve(__dirname, "../deployments/presale-base.json"), "utf8")
);

const expectedToken = deployment?.contracts?.Aetheron?.address;
const invalidPresale = deployment?.contracts?.InvalidPresale?.address;

if (!ethers.isAddress(expectedToken) || !ethers.isAddress(invalidPresale)) {
  throw new Error("Expected token or invalid presale address is missing from presale-base.json");
}

const provider = new ethers.JsonRpcProvider(
  process.env.BASE_RPC_URL || "https://mainnet.base.org",
  8453,
  { staticNetwork: true, batchMaxCount: 1 }
);

const network = await provider.getNetwork();
if (network.chainId !== 8453n) {
  throw new Error(`Expected Base chain 8453, received ${network.chainId}`);
}

const code = (await provider.getCode(invalidPresale)).toLowerCase();
if (code === "0x") throw new Error("Invalid presale has no deployed bytecode");

const candidateSignatures = [
  "buyTokens()",
  "cancel()",
  "claimRefund()",
  "claimTokens()",
  "finalize()",
  "withdrawFunds()",
  "withdrawUnsoldTokens()",
  "rescueTokens(address,uint256)",
  "rescueERC20(address,uint256)",
  "recoverERC20(address,uint256)",
  "recoverTokens(address,uint256)",
  "sweepToken(address,uint256)",
  "sweep(address,address,uint256)",
  "withdrawToken(address,uint256)",
  "emergencyWithdraw()",
  "emergencyTokenWithdraw(address,uint256)",
  "transferOwnership(address)",
  "renounceOwnership()",
  "updateRate(uint256)",
  "updateCaps(uint256,uint256)",
  "updateContributionLimits(uint256,uint256)",
  "updateSchedule(uint256,uint256)"
];

const selectorScan = Object.fromEntries(candidateSignatures.map((signature) => {
  const selector = ethers.id(signature).slice(0, 10).toLowerCase();
  return [signature, {
    selector,
    presentInRuntimeBytecode: code.includes(selector.slice(2))
  }];
}));

const genericRecoverySignatures = candidateSignatures.filter((signature) =>
  /^(rescue|recover|sweep|withdrawToken|emergencyTokenWithdraw)/.test(signature)
);
const genericRecoverySelectorsPresent = genericRecoverySignatures.filter(
  (signature) => selectorScan[signature].presentInRuntimeBytecode
);

const PRESALE_ABI = [
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function weiRaised() view returns (uint256)",
  "function cancelled() view returns (bool)",
  "function finalized() view returns (bool)"
];
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const presale = new ethers.Contract(invalidPresale, PRESALE_ABI, provider);
const token = new ethers.Contract(expectedToken, TOKEN_ABI, provider);
const latestBlock = await provider.getBlock("latest");
if (!latestBlock) throw new Error("Unable to read latest Base block");

const [linkedToken, owner, weiRaised, cancelled, finalized, expectedTokenBalance, decimals, nativeBalance] =
  await Promise.all([
    presale.token(),
    presale.owner(),
    presale.weiRaised(),
    presale.cancelled(),
    presale.finalized(),
    token.balanceOf(invalidPresale),
    token.decimals(),
    provider.getBalance(invalidPresale)
  ]);
const linkedTokenCode = await provider.getCode(linkedToken);

function probeArgs(signature) {
  if (signature.includes("(address,address,uint256)")) return [expectedToken, owner, 0n];
  if (signature.includes("(address,uint256)")) return [expectedToken, 0n];
  if (signature === "transferOwnership(address)") return [owner];
  if (signature === "updateRate(uint256)") return [1n];
  if (signature === "updateCaps(uint256,uint256)") return [1n, 1n];
  if (signature === "updateContributionLimits(uint256,uint256)") return [1n, 1n];
  if (signature === "updateSchedule(uint256,uint256)") {
    return [BigInt(latestBlock.timestamp + 3600), BigInt(latestBlock.timestamp + 7200)];
  }
  return [];
}

function extractError(error) {
  const revertData =
    error?.data ||
    error?.info?.error?.data ||
    error?.error?.data ||
    null;
  return {
    code: error?.code || null,
    shortMessage: error?.shortMessage || null,
    reason: error?.reason || null,
    message: error?.message || String(error),
    revertData: typeof revertData === "string" ? revertData : null
  };
}

async function probeSignature(signature) {
  const iface = new ethers.Interface([`function ${signature}`]);
  const functionName = signature.slice(0, signature.indexOf("("));
  const data = iface.encodeFunctionData(functionName, probeArgs(signature));
  const transaction = {
    to: invalidPresale,
    from: owner,
    data
  };
  if (signature === "buyTokens()") transaction.value = 0n;

  try {
    const output = await provider.call(transaction);
    return {
      ethCallSucceeded: true,
      output,
      error: null
    };
  } catch (error) {
    return {
      ethCallSucceeded: false,
      output: null,
      error: extractError(error)
    };
  }
}

const callProbes = {};
for (const signature of candidateSignatures) {
  callProbes[signature] = await probeSignature(signature);
}

const genericRecoveryCallsSucceeded = genericRecoverySignatures.filter(
  (signature) => callProbes[signature].ethCallSucceeded
);
const genericRecoveryCallsWithRevertData = genericRecoverySignatures.filter(
  (signature) => Boolean(callProbes[signature].error?.revertData)
);

const normalUnsoldWithdrawalPresent = selectorScan["withdrawUnsoldTokens()"].presentInRuntimeBytecode;
const normalUnsoldWithdrawalProbe = callProbes["withdrawUnsoldTokens()"];
const normalUnsoldWithdrawalCanTargetExpectedToken =
  normalUnsoldWithdrawalPresent && linkedToken.toLowerCase() === expectedToken.toLowerCase();

let conclusion;
if (genericRecoveryCallsSucceeded.length > 0) {
  conclusion = "At least one generic recovery call succeeded under eth_call. Verify exact deployed source and authorization before any transaction.";
} else if (genericRecoverySelectorsPresent.length > 0 || genericRecoveryCallsWithRevertData.length > 0) {
  conclusion = "At least one generic recovery candidate has bytecode or revert-data evidence, but none succeeded. Exact deployed source must be verified before concluding whether recovery is possible.";
} else {
  conclusion = "No scanned generic ERC-20 recovery candidate succeeded or produced supporting selector evidence. The normal unsold-token path cannot target the expected AETH because token() points elsewhere.";
}

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  chainId: network.chainId.toString(),
  latestBlock: latestBlock.number,
  expectedToken,
  invalidPresale,
  runtimeBytecodeBytes: (code.length - 2) / 2,
  owner,
  linkedToken,
  linkedTokenHasBytecode: linkedTokenCode !== "0x",
  linkedTokenMatchesExpected: linkedToken.toLowerCase() === expectedToken.toLowerCase(),
  expectedTokenBalance: ethers.formatUnits(expectedTokenBalance, decimals),
  nativeBalance: ethers.formatEther(nativeBalance),
  weiRaised: ethers.formatEther(weiRaised),
  cancelled,
  finalized,
  normalUnsoldWithdrawalPresent,
  normalUnsoldWithdrawalProbe,
  normalUnsoldWithdrawalCanTargetExpectedToken,
  genericRecoverySelectorsPresent,
  genericRecoveryCallsSucceeded,
  genericRecoveryCallsWithRevertData,
  selectorScan,
  callProbes,
  conclusion
}, null, 2));
