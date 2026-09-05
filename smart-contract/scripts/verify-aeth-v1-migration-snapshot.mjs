import fs from "node:fs";
import { JsonRpcProvider, Contract, Interface, getAddress } from "ethers";
import { readWithRetry } from "./lib/base-read-retry.mjs";

const MANIFEST_URL = new URL("../deployments/aeth-v2-migration.json", import.meta.url);
const SNAPSHOT_CONFIRMATIONS = 3;
const MULTICALL3_ADDRESS = getAddress("0xca11bde05977b3631167028862be2a173976ca11");
const ERC20_READ_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];
const MULTICALL3_ABI = [
  "function aggregate3((address target,bool allowFailure,bytes callData)[] calls) payable returns ((bool success,bytes returnData)[] returnData)",
];

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_URL, "utf8"));
}

function tokenWei(tokens, decimals) {
  return BigInt(String(tokens)) * 10n ** BigInt(decimals);
}

function serialize(value) {
  return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
}

function requireCallResult(result, label) {
  if (!result?.success) {
    throw new Error(`${label} failed in pinned-block multicall`);
  }
  return result.returnData;
}

async function main() {
  const rpcUrl = process.env.BASE_RPC_URL?.trim();
  if (!rpcUrl) {
    throw new Error("BASE_RPC_URL is required for the read-only migration snapshot verifier");
  }

  const manifest = loadManifest();
  if (manifest.chainId !== 8453) {
    throw new Error(`Migration manifest must target Base Mainnet chain 8453, found ${manifest.chainId}`);
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await readWithRetry(() => provider.getNetwork(), "Base network");
  if (Number(network.chainId) !== manifest.chainId) {
    throw new Error(`RPC chain mismatch: expected ${manifest.chainId}, found ${network.chainId}`);
  }

  const latestBlockNumber = await readWithRetry(() => provider.getBlockNumber(), "Base block number");
  const blockNumber = Math.max(latestBlockNumber - SNAPSHOT_CONFIRMATIONS, 0);
  const pinnedBlock = await readWithRetry(
    () => provider.getBlock(blockNumber),
    `Base pinned block ${blockNumber}`,
    { validate: (value) => Boolean(value?.hash) },
  );

  const tokenAddress = getAddress(manifest.canonicalToken.address);
  const [tokenBytecode, multicallBytecode] = await Promise.all([
    readWithRetry(() => provider.getCode(tokenAddress, blockNumber), "AETH V1 bytecode"),
    readWithRetry(() => provider.getCode(MULTICALL3_ADDRESS, blockNumber), "Base Multicall3 bytecode"),
  ]);
  if (!tokenBytecode || tokenBytecode === "0x") {
    throw new Error(`No runtime bytecode found at canonical AETH V1 address ${tokenAddress} at block ${blockNumber}`);
  }
  if (!multicallBytecode || multicallBytecode === "0x") {
    throw new Error(`No Multicall3 runtime bytecode found at ${MULTICALL3_ADDRESS} at block ${blockNumber}`);
  }

  const tokenInterface = new Interface(ERC20_READ_ABI);
  const callSpecs = [
    { label: "AETH V1 decimals", functionName: "decimals", args: [] },
    { label: "AETH V1 totalSupply", functionName: "totalSupply", args: [] },
    ...manifest.v1Snapshot.balances.map((row) => ({
      label: `AETH V1 balanceOf(${row.role})`,
      functionName: "balanceOf",
      args: [getAddress(row.address)],
      row,
    })),
  ];
  const calls = callSpecs.map((spec) => ({
    target: tokenAddress,
    allowFailure: true,
    callData: tokenInterface.encodeFunctionData(spec.functionName, spec.args),
  }));

  const multicall = new Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
  const results = await readWithRetry(
    () => multicall.aggregate3.staticCall(calls, { blockTag: blockNumber }),
    "AETH V1 pinned-block multicall",
    { validate: (value) => value?.length === calls.length },
  );

  const decoded = results.map((result, index) => {
    const spec = callSpecs[index];
    const returnData = requireCallResult(result, spec.label);
    return tokenInterface.decodeFunctionResult(spec.functionName, returnData)[0];
  });

  const decimals = Number(decoded[0]);
  const totalSupplyWei = BigInt(decoded[1]);
  if (decimals !== 18) {
    throw new Error(`AETH V1 decimals mismatch: expected 18, found ${decimals}`);
  }

  const expectedSupplyWei = tokenWei(manifest.v1Snapshot.totalSupplyTokens, decimals);
  if (totalSupplyWei !== expectedSupplyWei) {
    throw new Error(`AETH V1 total supply mismatch at block ${blockNumber}: expected ${expectedSupplyWei}, found ${totalSupplyWei}`);
  }

  const rows = [];
  let expectedTotalWei = 0n;
  let currentTotalWei = 0n;
  let mismatches = 0;

  manifest.v1Snapshot.balances.forEach((row, rowIndex) => {
    const address = getAddress(row.address);
    const expectedWei = tokenWei(row.tokens, decimals);
    const currentWei = BigInt(decoded[rowIndex + 2]);
    const deltaWei = currentWei - expectedWei;
    const matches = deltaWei === 0n;

    expectedTotalWei += expectedWei;
    currentTotalWei += currentWei;
    if (!matches) mismatches += 1;

    rows.push({
      role: row.role,
      address,
      expectedTokens: String(row.tokens),
      expectedWei,
      currentWei,
      deltaWei,
      matches,
    });
  });

  const expectedLedgerWei = tokenWei(manifest.v1Snapshot.reconciledSupplyTokens, decimals);
  const totalsMatch = expectedTotalWei === expectedLedgerWei && currentTotalWei === totalSupplyWei;
  if (!totalsMatch) mismatches += 1;

  const report = {
    checkedAt: new Date().toISOString(),
    chainId: Number(network.chainId),
    latestBlockNumber,
    snapshotConfirmations: SNAPSHOT_CONFIRMATIONS,
    blockNumber,
    blockHash: pinnedBlock.hash,
    tokenAddress,
    multicallAddress: MULTICALL3_ADDRESS,
    decimals,
    totalSupplyWei,
    expectedLedgerWei,
    currentTrackedBalanceTotalWei: currentTotalWei,
    expectedTrackedBalanceTotalWei: expectedTotalWei,
    rows,
    matchesPreparedLedger: mismatches === 0,
    mismatchCount: mismatches,
    authorizationChanged: false,
    note: "Read-only evidence only. This verifier does not approve migration, deploy V2, transfer tokens, create liquidity, or modify the migration manifest.",
  };

  const output = serialize(report);
  console.log(output);

  const outputPath = process.env.SNAPSHOT_OUTPUT_PATH?.trim();
  if (outputPath) {
    fs.writeFileSync(outputPath, `${output}\n`, "utf8");
  }

  if (!report.matchesPreparedLedger) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
