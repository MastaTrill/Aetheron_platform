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
if (network.chainId !== EXPECTED_CHAIN_ID) throw new Error(`Expected Base chain 8453, received ${network.chainId}`);

const ABI = [
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function weiRaised() view returns (uint256)",
  "function cancelled() view returns (bool)",
  "function finalized() view returns (bool)",
  "function cancel()"
];

const presale = new ethers.Contract(INVALID_PRESALE, ABI, wallet);
if ((await provider.getCode(INVALID_PRESALE)) === "0x") throw new Error("Invalid presale address has no Base bytecode");

const [linkedToken, owner, weiRaised, cancelled, finalized] = await Promise.all([
  presale.token(),
  presale.owner(),
  presale.weiRaised(),
  presale.cancelled(),
  presale.finalized()
]);

console.log(JSON.stringify({
  presale: INVALID_PRESALE,
  expectedToken: EXPECTED_TOKEN,
  linkedToken,
  owner,
  signer: wallet.address,
  weiRaised: ethers.formatEther(weiRaised),
  cancelled,
  finalized
}, null, 2));

if (linkedToken.toLowerCase() === EXPECTED_TOKEN.toLowerCase()) {
  throw new Error("Safety stop: presale token linkage now matches the expected token");
}
if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
  throw new Error("Connected wallet is not the invalid presale owner");
}
if (finalized) throw new Error("Invalid presale is already finalized and cannot be cancelled");
if (cancelled) {
  console.log("Invalid presale is already cancelled. No transaction sent.");
  process.exit(0);
}
if (process.env.CONFIRM_CANCEL_INVALID_PRESALE !== "CANCEL_MISMATCHED_PRESALE") {
  throw new Error("Set CONFIRM_CANCEL_INVALID_PRESALE=CANCEL_MISMATCHED_PRESALE to authorize cancellation");
}

const tx = await presale.cancel();
console.log("Cancellation transaction:", tx.hash);
await tx.wait();
if (!(await presale.cancelled())) throw new Error("Cancellation did not persist on-chain");
console.log("Invalid presale cancelled successfully. Contributors, if any, can use claimRefund().");
