import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const EXPECTED_TOKEN = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";
const INVALID_PRESALE = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) throw new Error("PRIVATE_KEY is required");

const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
  staticNetwork: true,
  batchMaxCount: 1
});
const wallet = new ethers.Wallet(privateKey, provider);
const network = await provider.getNetwork();
if (network.chainId !== EXPECTED_CHAIN_ID) {
  throw new Error(`Expected Base chain 8453, received ${network.chainId}`);
}

const PRESALE_ABI = [
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function weiRaised() view returns (uint256)",
  "function cancelled() view returns (bool)",
  "function finalized() view returns (bool)",
  "function cancel()"
];

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const presaleCode = await provider.getCode(INVALID_PRESALE);
if (presaleCode === "0x") throw new Error("Invalid presale address has no Base bytecode");

const presale = new ethers.Contract(INVALID_PRESALE, PRESALE_ABI, wallet);
const expectedToken = new ethers.Contract(EXPECTED_TOKEN, TOKEN_ABI, provider);

const [
  linkedToken,
  owner,
  weiRaised,
  cancelled,
  finalized,
  expectedTokenBalance,
  expectedTokenDecimals,
  presaleNativeBalance,
  signerNativeBalance
] = await Promise.all([
  presale.token(),
  presale.owner(),
  presale.weiRaised(),
  presale.cancelled(),
  presale.finalized(),
  expectedToken.balanceOf(INVALID_PRESALE),
  expectedToken.decimals(),
  provider.getBalance(INVALID_PRESALE),
  provider.getBalance(wallet.address)
]);

const linkedTokenCode = await provider.getCode(linkedToken);

console.log(JSON.stringify({
  chainId: network.chainId.toString(),
  presale: INVALID_PRESALE,
  presaleBytecodeBytes: (presaleCode.length - 2) / 2,
  expectedToken: EXPECTED_TOKEN,
  linkedToken,
  linkedTokenMatchesExpected: linkedToken.toLowerCase() === EXPECTED_TOKEN.toLowerCase(),
  linkedTokenHasBytecode: linkedTokenCode !== "0x",
  owner,
  signer: wallet.address,
  signerNativeBalance: ethers.formatEther(signerNativeBalance),
  presaleNativeBalance: ethers.formatEther(presaleNativeBalance),
  expectedTokenBalance: ethers.formatUnits(expectedTokenBalance, expectedTokenDecimals),
  weiRaised: ethers.formatEther(weiRaised),
  cancelled,
  finalized,
  transactionAuthorized: process.env.CONFIRM_CANCEL_INVALID_PRESALE === "CANCEL_MISMATCHED_PRESALE"
}, null, 2));

if (linkedToken.toLowerCase() === EXPECTED_TOKEN.toLowerCase()) {
  throw new Error("Safety stop: presale token linkage now matches the expected token");
}
if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
  throw new Error("Connected wallet is not the invalid presale owner");
}
if (signerNativeBalance === 0n) {
  throw new Error("Owner wallet has no Base ETH for cancellation gas");
}
if (finalized) throw new Error("Invalid presale is already finalized and cannot be cancelled");
if (cancelled) {
  console.log("Invalid presale is already cancelled. No transaction sent.");
  process.exit(0);
}
if (process.env.CONFIRM_CANCEL_INVALID_PRESALE !== "CANCEL_MISMATCHED_PRESALE") {
  throw new Error("Set CONFIRM_CANCEL_INVALID_PRESALE=CANCEL_MISMATCHED_PRESALE to authorize cancellation");
}

await presale.cancel.staticCall();
const gasEstimate = await presale.cancel.estimateGas();
const gasLimit = gasEstimate * 120n / 100n;
console.log(JSON.stringify({
  simulation: "passed",
  gasEstimate: gasEstimate.toString(),
  gasLimit: gasLimit.toString()
}, null, 2));

const tx = await presale.cancel({ gasLimit });
console.log("Cancellation transaction:", tx.hash);
const receipt = await tx.wait();
if (!receipt || receipt.status !== 1) throw new Error("Cancellation transaction failed");
if (!(await presale.cancelled())) throw new Error("Cancellation did not persist on-chain");
console.log("Invalid presale cancelled successfully. Contributors, if any, can use claimRefund().");
