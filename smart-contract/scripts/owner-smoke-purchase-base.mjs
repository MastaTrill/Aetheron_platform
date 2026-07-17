import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const EXPECTED_TOKEN = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";
const EXPECTED_PURCHASE = "0.001";
const CONFIRMATION = "BUY_0_001_ETH_OWNER_SMOKE_TEST";

if (process.env.CONFIRM_OWNER_SMOKE_PURCHASE !== CONFIRMATION) {
  throw new Error(`Set CONFIRM_OWNER_SMOKE_PURCHASE=${CONFIRMATION} to authorize the real Base purchase`);
}

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error("PRIVATE_KEY is required");
const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const purchaseEth = process.env.OWNER_SMOKE_PURCHASE_ETH || EXPECTED_PURCHASE;
if (purchaseEth !== EXPECTED_PURCHASE) {
  throw new Error(`Safety stop: owner smoke purchase must be exactly ${EXPECTED_PURCHASE} ETH`);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const deploymentPath = path.resolve(scriptDir, "..", "deployments", "presale-base.json");
const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const presaleAddress = deployment.contracts?.Presale?.address;
const ownerAddress = deployment.wallets?.owner;
if (!ethers.isAddress(presaleAddress || "")) throw new Error("Replacement presale address is not recorded");
if (!ethers.isAddress(ownerAddress || "")) throw new Error("Deployment owner address is not recorded");

const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
  staticNetwork: true,
  batchMaxCount: 1
});
const wallet = new ethers.Wallet(privateKey, provider);
const network = await provider.getNetwork();
if (network.chainId !== EXPECTED_CHAIN_ID) throw new Error(`Expected Base 8453, received ${network.chainId}`);
if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
  throw new Error("Connected signer does not match the recorded presale owner");
}
if ((await provider.getCode(presaleAddress)) === "0x") throw new Error("Replacement presale has no Base bytecode");

const ABI = [
  "function buyTokens() payable",
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function rate() view returns (uint256)",
  "function weiRaised() view returns (uint256)",
  "function tokensReserved() view returns (uint256)",
  "function contributions(address) view returns (uint256)",
  "function tokensOwed(address) view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function maxContribution() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function cancelled() view returns (bool)",
  "function finalized() view returns (bool)"
];
const presale = new ethers.Contract(presaleAddress, ABI, wallet);
const value = ethers.parseEther(purchaseEth);

const [
  presaleOwner,
  linkedToken,
  rate,
  weiRaisedBefore,
  reservedBefore,
  contributionBefore,
  owedBefore,
  minContribution,
  maxContribution,
  hardCap,
  startTime,
  endTime,
  cancelled,
  finalized,
  signerBalance
] = await Promise.all([
  presale.owner(),
  presale.token(),
  presale.rate(),
  presale.weiRaised(),
  presale.tokensReserved(),
  presale.contributions(wallet.address),
  presale.tokensOwed(wallet.address),
  presale.minContribution(),
  presale.maxContribution(),
  presale.hardCap(),
  presale.startTime(),
  presale.endTime(),
  presale.cancelled(),
  presale.finalized(),
  provider.getBalance(wallet.address)
]);

if (presaleOwner.toLowerCase() !== wallet.address.toLowerCase()) throw new Error("Signer is not the replacement presale owner");
if (linkedToken.toLowerCase() !== EXPECTED_TOKEN.toLowerCase()) throw new Error("Replacement presale token linkage is incorrect");
if (cancelled || finalized) throw new Error("Replacement presale is cancelled or finalized");
const now = BigInt(Math.floor(Date.now() / 1000));
if (now < startTime) throw new Error(`Presale has not started; startTime=${startTime}`);
if (now > endTime) throw new Error("Presale has ended");
if (value < minContribution) throw new Error("Smoke purchase is below the contract minimum");
if (contributionBefore + value > maxContribution) throw new Error("Smoke purchase would exceed the owner wallet cap");
if (weiRaisedBefore + value > hardCap) throw new Error("Smoke purchase would exceed the hard cap");
if (signerBalance <= value) throw new Error("Owner wallet lacks purchase value plus gas");

await presale.buyTokens.staticCall({ value });
const gasEstimate = await presale.buyTokens.estimateGas({ value });
const gasLimit = gasEstimate * 120n / 100n;
const expectedTokens = value * rate;

console.log(JSON.stringify({
  chainId: network.chainId.toString(),
  signer: wallet.address,
  presaleAddress,
  linkedToken,
  purchaseEth,
  expectedTokens: ethers.formatUnits(expectedTokens, 18),
  gasEstimate: gasEstimate.toString(),
  gasLimit: gasLimit.toString(),
  simulation: "passed"
}, null, 2));

const tx = await presale.buyTokens({ value, gasLimit });
console.log(`Owner smoke purchase transaction: ${tx.hash}`);
const receipt = await tx.wait();
if (!receipt || receipt.status !== 1) throw new Error("Owner smoke purchase transaction failed");

const [weiRaisedAfter, reservedAfter, contributionAfter, owedAfter] = await Promise.all([
  presale.weiRaised(),
  presale.tokensReserved(),
  presale.contributions(wallet.address),
  presale.tokensOwed(wallet.address)
]);

if (weiRaisedAfter - weiRaisedBefore !== value) throw new Error("weiRaised delta is incorrect");
if (reservedAfter - reservedBefore !== expectedTokens) throw new Error("tokensReserved delta is incorrect");
if (contributionAfter - contributionBefore !== value) throw new Error("Owner contribution delta is incorrect");
if (owedAfter - owedBefore !== expectedTokens) throw new Error("Owner tokensOwed delta is incorrect");

deployment.ownerSmokePurchase = {
  status: "passed",
  executedAt: new Date().toISOString(),
  buyer: wallet.address,
  valueWei: value.toString(),
  valueEth: purchaseEth,
  tokenUnits: expectedTokens.toString(),
  tokenAmount: ethers.formatUnits(expectedTokens, 18),
  transactionHash: tx.hash,
  blockNumber: receipt.blockNumber
};
fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2) + "\n");

console.log(JSON.stringify(deployment.ownerSmokePurchase, null, 2));
