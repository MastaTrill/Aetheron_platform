import { ethers } from "ethers";

const tokenAddress = ethers.getAddress(
  process.env.AETH_TOKEN_ADDRESS || "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e"
);
const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const provider = new ethers.JsonRpcProvider(rpcUrl, 8453, {
  staticNetwork: true,
  batchMaxCount: 1
});

let cachedCreationRecord;
async function recoverCreationRecord() {
  if (cachedCreationRecord) return cachedCreationRecord;

  const token = new ethers.Contract(tokenAddress, [
    "function owner() view returns (address)"
  ], provider);
  const creator = ethers.getAddress(await token.owner());
  const latestNonce = await provider.getTransactionCount(creator, "latest");

  let deploymentNonce = -1;
  for (let nonce = 0; nonce < latestNonce; nonce += 1) {
    if (ethers.getCreateAddress({ from: creator, nonce }) === tokenAddress) {
      deploymentNonce = nonce;
      break;
    }
  }
  if (deploymentNonce < 0) {
    throw new Error("Could not derive the AETH deployment nonce from its owner address");
  }

  let low = 0;
  let high = await provider.getBlockNumber();
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const count = await provider.getTransactionCount(creator, middle);
    if (count > deploymentNonce) high = middle;
    else low = middle + 1;
  }

  const block = await provider.getBlock(low, true);
  const transactions = block?.prefetchedTransactions || [];
  const creationTx = transactions.find(
    (tx) => tx.from?.toLowerCase() === creator.toLowerCase() && tx.nonce === deploymentNonce
  );
  if (!creationTx || creationTx.to !== null) {
    throw new Error("Could not recover the AETH creation transaction from its deployment block");
  }

  cachedCreationRecord = {
    contractAddress: tokenAddress,
    contractCreator: creator,
    txHash: creationTx.hash,
    blockNumber: String(low),
    timestamp: String(block.timestamp)
  };
  return cachedCreationRecord;
}

// Normalize requests to the documented Etherscan V2 method and parameter casing.
// The paid getcontractcreation lookup is replaced with deterministic Base RPC recovery.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const body = init.body instanceof URLSearchParams
    ? new URLSearchParams(init.body)
    : init.body;
  const action = url.searchParams.get("action") ||
    (body instanceof URLSearchParams ? body.get("action") : null);

  if (action === "getcontractcreation") {
    const record = await recoverCreationRecord();
    return new Response(JSON.stringify({ status: "1", message: "OK", result: [record] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  if (body instanceof URLSearchParams && body.has("evmversion")) {
    body.set("evmVersion", body.get("evmversion"));
    body.delete("evmversion");
  }

  if (action === "checkverifystatus" && !init.method) {
    const params = new URLSearchParams(url.searchParams);
    const chainId = params.get("chainid") || "8453";
    url.search = `?chainid=${encodeURIComponent(chainId)}`;
    return nativeFetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params
    });
  }

  return nativeFetch(url, { ...init, body });
};

await import("./verify-aeth-basescan-v2.mjs");
