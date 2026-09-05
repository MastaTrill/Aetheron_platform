import fs from "node:fs";
import { JsonRpcProvider, Contract, getAddress } from "ethers";
import { readWithRetry } from "./lib/base-read-retry.mjs";

const MANIFEST_URL = new URL("../deployments/aeth-v2-migration.json", import.meta.url);
const ERC20_READ_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
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

  const blockNumber = await readWithRetry(() => provider.getBlockNumber(), "Base block number");
  const tokenAddress = getAddress(manifest.canonicalToken.address);
  const bytecode = await readWithRetry(
    () => provider.getCode(tokenAddress, blockNumber),
    "AETH V1 bytecode",
  );
  if (!bytecode || bytecode === "0x") {
    throw new Error(`No runtime bytecode found at canonical AETH V1 address ${tokenAddress} at block ${blockNumber}`);
  }

  const token = new Contract(tokenAddress, ERC20_READ_ABI, provider);
  const decimals = Number(await readWithRetry(() => token.decimals({ blockTag: blockNumber }), "AETH V1 decimals"));
  const totalSupplyWei = await readWithRetry(() => token.totalSupply({ blockTag: blockNumber }), "AETH V1 totalSupply");

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

  for (const row of manifest.v1Snapshot.balances) {
    const address = getAddress(row.address);
    const expectedWei = tokenWei(row.tokens, decimals);
    const currentWei = await readWithRetry(
      () => token.balanceOf(address, { blockTag: blockNumber }),
      `AETH V1 balanceOf(${row.role})`,
    );
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
  }

  const expectedLedgerWei = tokenWei(manifest.v1Snapshot.reconciledSupplyTokens, decimals);
  const totalsMatch = expectedTotalWei === expectedLedgerWei && currentTotalWei === totalSupplyWei;
  if (!totalsMatch) mismatches += 1;

  const report = {
    checkedAt: new Date().toISOString(),
    chainId: Number(network.chainId),
    blockNumber,
    tokenAddress,
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
