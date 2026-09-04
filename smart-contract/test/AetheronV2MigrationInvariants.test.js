import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const migration = JSON.parse(fs.readFileSync(new URL("../deployments/aeth-v2-migration.json", import.meta.url), "utf8"));
const v1 = JSON.parse(fs.readFileSync(new URL("../deployments/aeth-base.json", import.meta.url), "utf8"));
const v2Source = fs.readFileSync(new URL("../contracts/AetheronV2.sol", import.meta.url), "utf8");
const deploySource = fs.readFileSync(new URL("../scripts/deploy-aeth-v2.mjs", import.meta.url), "utf8");
const ONE_BILLION_WEI = 1_000_000_000n * 10n ** 18n;
const V1 = "0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e";

function tokenUnits(value) {
  return BigInt(String(value));
}

describe("AETH V1 -> V2 migration invariants", function () {
  it("pins V1 as the canonical 1B Base token until cutover", function () {
    assert.equal(v1.chainId, 8453);
    assert.equal(v1.token.address.toLowerCase(), V1);
    assert.equal(BigInt(v1.token.totalSupplyWei), ONE_BILLION_WEI);
    assert.equal(migration.chainId, 8453);
    assert.equal(migration.canonicalToken.address.toLowerCase(), V1);
    assert.equal(migration.canonicalToken.version, "v1");
    assert.equal(migration.canonicalToken.status, "v1_canonical");
  });

  it("reconciles the dated V1 balance snapshot to exactly the full supply", function () {
    assert.equal(migration.v1Snapshot.observedAt, "2026-09-03");
    assert.equal(migration.v1Snapshot.source, "docs/LIVE_BASE_STATE_AUDIT_2026-09-03.md");
    const total = migration.v1Snapshot.balances.reduce((sum, row) => sum + tokenUnits(row.tokens), 0n);
    assert.equal(total, 1_000_000_000n);
    assert.equal(tokenUnits(migration.v1Snapshot.reconciledSupplyTokens), 1_000_000_000n);
  });

  it("pins V2 to the same 1B supply with 50/20/15/15 allocation", function () {
    assert.equal(BigInt(migration.v2.totalSupply), ONE_BILLION_WEI);
    assert.deepEqual(migration.v2.allocationPercent, {
      liquidity: 50,
      team: 20,
      marketing: 15,
      staking: 15,
    });
    const allocationTotal = Object.values(migration.v2.allocationPercent).reduce((sum, value) => sum + value, 0);
    assert.equal(allocationTotal, 100);
    assert.match(v2Source, /TOTAL_SUPPLY\s*=\s*1_000_000_000\s*\*\s*10\s*\*\*\s*18/);
    assert.match(v2Source, /LIQUIDITY_ALLOCATION\s*=\s*TOTAL_SUPPLY\s*\*\s*50\s*\/\s*100/);
    assert.match(v2Source, /TEAM_ALLOCATION\s*=\s*TOTAL_SUPPLY\s*\*\s*20\s*\/\s*100/);
    assert.match(v2Source, /MARKETING_ALLOCATION\s*=\s*TOTAL_SUPPLY\s*\*\s*15\s*\/\s*100/);
    assert.match(v2Source, /STAKING_ALLOCATION\s*=\s*TOTAL_SUPPLY\s*\*\s*15\s*\/\s*100/);
  });

  it("requires verified deployment and release evidence before canonical cutover", function () {
    const evidence = migration.cutover.evidence;
    assert.equal(migration.cutover.authorized, false);
    assert.equal(migration.cutover.targetAddress, null);
    assert.equal(evidence.v2AddressRecorded, false);
    assert.equal(evidence.sourceVerified, false);
    assert.equal(evidence.runtimeVerified, false);
    assert.equal(evidence.supplyVerified, false);
    assert.equal(evidence.balanceMigrationPlanApproved, false);
    assert.equal(evidence.releaseAuthorized, false);
    assert.equal(migration.publicLaunchAuthorized, false);
    assert.equal(migration.liquidityAuthorized, false);
    assert.equal(migration.migrationAuthorized, false);
  });

  it("does not let the deployment script perform or authorize canonical cutover", function () {
    assert.doesNotMatch(deploySource, /canonicalToken\s*=/);
    assert.doesNotMatch(deploySource, /publicLaunchAuthorized\s*=\s*true/);
    assert.doesNotMatch(deploySource, /liquidityAuthorized\s*=\s*true/);
    assert.doesNotMatch(deploySource, /migrationAuthorized\s*=\s*true/);
    assert.doesNotMatch(deploySource, /cutover\.authorized\s*=\s*true/);
    assert.match(deploySource, /manifest\.cutover\.targetAddress\s*=\s*address/);
    assert.match(deploySource, /manifest\.cutover\.evidence\.v2AddressRecorded\s*=\s*true/);
    assert.match(deploySource, /manifest\.cutover\.evidence\.runtimeVerified\s*=\s*true/);
    assert.match(deploySource, /manifest\.cutover\.evidence\.supplyVerified\s*=\s*true/);
    assert.doesNotMatch(deploySource, /manifest\.cutover\.evidence\.sourceVerified\s*=\s*true/);
    assert.doesNotMatch(deploySource, /manifest\.cutover\.evidence\.releaseAuthorized\s*=\s*true/);
  });
});