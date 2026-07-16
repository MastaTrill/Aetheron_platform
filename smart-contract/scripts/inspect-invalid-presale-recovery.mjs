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

const normalUnsoldWithdrawalPresent = selectorScan["withdrawUnsoldTokens()"].presentInRuntimeBytecode;
const normalUnsoldWithdrawalCanTargetExpectedToken =
  normalUnsoldWithdrawalPresent && linkedToken.toLowerCase() === expectedToken.toLowerCase();

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  chainId: network.chainId.toString(),
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
  normalUnsoldWithdrawalCanTargetExpectedToken,
  genericRecoverySelectorsPresent,
  selectorScan,
  conclusion:
    genericRecoverySelectorsPresent.length > 0
      ? "At least one candidate generic recovery selector is present; source/authorization must be verified before any transaction."
      : "No scanned generic ERC-20 recovery selector is present. The normal unsold-token withdrawal cannot target the expected AETH because token() points elsewhere."
}, null, 2));
