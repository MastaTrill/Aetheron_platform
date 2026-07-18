import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "../..");
const journalPath = path.join(rootDir, "smart-contract/deployments/presale-base.json");
const frontendPath = path.join(rootDir, "presale-config.js");

const EXPECTED_CHAIN_ID = 8453n;
const EXPECTED_OWNER = "0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2";
const EXPECTED_TOKEN = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";
const SMOKE_AMOUNT = ethers.parseEther("0.0003");
const EXPECTED_RATE = 1_000_000n;

if (process.env.CONFIRM_PUBLIC_PRESALE_LAUNCH !== "SMOKE_TEST_AND_ENABLE_PUBLIC_PRESALE") {
  throw new Error("Explicit public presale launch confirmation is missing");
}
if (!process.env.BASE_RPC_URL) throw new Error("BASE_RPC_URL is required");
if (!process.env.PRIVATE_KEY) throw new Error("BASE_DEPLOYER_PRIVATE_KEY is required");

const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
const presaleAddress = journal.contracts?.Presale?.address;
if (!ethers.isAddress(presaleAddress || "")) throw new Error("Verified presale address is missing");
if (journal.verification?.verified !== true) throw new Error("BaseScan verification is not recorded");
if (journal.frontend?.publicPurchaseAddressEnabled !== false) throw new Error("Public purchase address is not safely disabled");

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL, 8453, { staticNetwork: true, batchMaxCount: 1 });
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const network = await provider.getNetwork();
if (network.chainId !== EXPECTED_CHAIN_ID) throw new Error(`Wrong chain: ${network.chainId}`);
if (wallet.address.toLowerCase() !== EXPECTED_OWNER.toLowerCase()) throw new Error("Protected signer is not the approved owner wallet");
if ((await provider.getCode(presaleAddress)) === "0x") throw new Error("Presale bytecode is missing");

const abi = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function rate() view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function maxContribution() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function cancelled() view returns (bool)",
  "function finalized() view returns (bool)",
  "function weiRaised() view returns (uint256)",
  "function contributions(address) view returns (uint256)",
  "function tokensOwed(address) view returns (uint256)",
  "function buyTokens() payable"
];
const presale = new ethers.Contract(presaleAddress, abi, wallet);
const [owner, token, rate, minimum, maximum, start, end, cancelled, finalized, beforeRaised, beforeContribution, beforeOwed, block] = await Promise.all([
  presale.owner(), presale.token(), presale.rate(), presale.minContribution(), presale.maxContribution(),
  presale.startTime(), presale.endTime(), presale.cancelled(), presale.finalized(), presale.weiRaised(),
  presale.contributions(wallet.address), presale.tokensOwed(wallet.address), provider.getBlock("latest")
]);
if (owner.toLowerCase() !== EXPECTED_OWNER.toLowerCase()) throw new Error("Presale owner mismatch");
if (token.toLowerCase() !== EXPECTED_TOKEN.toLowerCase()) throw new Error("Presale token mismatch");
if (rate !== EXPECTED_RATE || minimum !== SMOKE_AMOUNT) throw new Error("Rate or minimum contribution mismatch");
if (SMOKE_AMOUNT > maximum) throw new Error("Smoke purchase exceeds wallet maximum");
if (cancelled || finalized) throw new Error("Presale is cancelled or finalized");
if (!block || BigInt(block.timestamp) < start || BigInt(block.timestamp) > end) throw new Error("Presale is outside its sale window");
if (beforeContribution + SMOKE_AMOUNT > maximum) throw new Error("Owner wallet contribution would exceed its cumulative maximum");

await presale.buyTokens.staticCall({ value: SMOKE_AMOUNT });
const tx = await presale.buyTokens({ value: SMOKE_AMOUNT, gasLimit: 300_000n });
console.log(JSON.stringify({ smokePurchaseBroadcast: tx.hash, amountEth: "0.0003" }));
const receipt = await tx.wait(2);
if (!receipt || receipt.status !== 1) throw new Error("Smoke purchase transaction failed");

const [afterRaised, afterContribution, afterOwed] = await Promise.all([
  presale.weiRaised(), presale.contributions(wallet.address), presale.tokensOwed(wallet.address)
]);
const expectedTokens = SMOKE_AMOUNT * EXPECTED_RATE;
if (afterRaised !== beforeRaised + SMOKE_AMOUNT) throw new Error("weiRaised did not increase by the smoke amount");
if (afterContribution !== beforeContribution + SMOKE_AMOUNT) throw new Error("Owner contribution accounting mismatch");
if (afterOwed !== beforeOwed + expectedTokens) throw new Error("Owner token reservation accounting mismatch");

const now = new Date().toISOString();
journal.status = "live-owner-smoke-purchase-confirmed";
journal.launchable = true;
journal.transactions.smokePurchase = { hash: tx.hash, blockNumber: receipt.blockNumber, status: receipt.status, amountWei: SMOKE_AMOUNT.toString() };
journal.smokePurchase = { buyer: wallet.address, amountEth: "0.0003", tokenAmount: ethers.formatUnits(expectedTokens, 18), confirmedAt: now };
journal.frontend = { replacementAddressPublished: true, publicPurchaseAddressEnabled: true, status: "live", updatedAt: now };
fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2) + "\n");

const frontend = `window.AETHERON_PRESALE_CONFIG = {\n  aethTokenAddress: "${EXPECTED_TOKEN}",\n  presaleContractAddress: "${presaleAddress}",\n  replacementPresaleContractAddress: "${presaleAddress}",\n  invalidPresaleContractAddress: "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C",\n  status: "live",\n  statusMessage: "The verified Aetheron Base presale is live.",\n  maxPresaleTokens: 33333333,\n  network: "base",\n  chainId: 8453,\n  nativeSymbol: "ETH",\n  minContribution: 0.0003,\n  maxContribution: 33.333333\n};\n`;
fs.writeFileSync(frontendPath, frontend);
console.log(JSON.stringify({ success: true, presaleAddress, smokePurchaseHash: tx.hash, publicPurchaseAddressEnabled: true }, null, 2));
