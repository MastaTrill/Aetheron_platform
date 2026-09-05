import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const manifestUrl = new URL("../deployments/aeth-v2-migration.json", import.meta.url);
const lockUrl = new URL("../contracts/AetheronPermanentSupplyLock.sol", import.meta.url);
const migration = JSON.parse(fs.readFileSync(manifestUrl, "utf8"));

function tokens(value) {
  return BigInt(String(value));
}

describe("AETH V2 migration ledger", function () {
  it("preserves the 1B nominal supply while mirroring the 50M inaccessible V1 balance", function () {
    const plan = migration.migrationPlan;
    assert.equal(plan?.status, "prepared_unapproved");
    assert.equal(tokens(plan?.sourceNominalSupplyTokens), 1_000_000_000n);
    assert.equal(tokens(plan?.sourceAccessibleSupplyTokens), 950_000_000n);
    assert.equal(tokens(plan?.sourceInaccessibleSupplyTokens), 50_000_000n);
    assert.equal(tokens(plan?.targetAccessibleSupplyTokens), 950_000_000n);
    assert.equal(tokens(plan?.targetPermanentlyLockedSupplyTokens), 50_000_000n);
  });

  it("reconciles every migration row to exactly 1B AETH", function () {
    const rows = migration.migrationPlan?.rows ?? [];
    const sourceTotal = rows.reduce((sum, row) => sum + tokens(row.sourceTokens), 0n);
    const targetTotal = rows.reduce((sum, row) => sum + tokens(row.targetTokens), 0n);
    const accessibleTarget = rows
      .filter((row) => row.targetDisposition !== "permanent_supply_lock")
      .reduce((sum, row) => sum + tokens(row.targetTokens), 0n);

    assert.equal(sourceTotal, 1_000_000_000n);
    assert.equal(targetTotal, 1_000_000_000n);
    assert.equal(accessibleTarget, 950_000_000n);
  });

  it("never treats the invalid-presale 50M as accessible V2 supply", function () {
    const row = migration.migrationPlan?.rows?.find((entry) => entry.sourceRole === "invalid_presale");
    assert.ok(row);
    assert.equal(row.sourceAddress.toLowerCase(), "0xa7aa360d2f00cf4130b3244d0a13ae32a49ab07c");
    assert.equal(tokens(row.sourceTokens), 50_000_000n);
    assert.equal(tokens(row.targetTokens), 50_000_000n);
    assert.equal(row.targetDisposition, "permanent_supply_lock");
    assert.equal(row.targetAddress, null);
    assert.equal(row.executionAuthorized, false);
  });

  it("accounts for the recoverable replacement-presale balance without assigning V2 to the legacy presale", function () {
    const row = migration.migrationPlan?.rows?.find((entry) => entry.sourceRole === "replacement_presale");
    assert.ok(row);
    assert.equal(tokens(row.sourceTokens), 33_333_333n);
    assert.equal(tokens(row.currentReservedTokens), 4_900n);
    assert.equal(tokens(row.currentUnsoldRecoverableTokens), 33_328_433n);
    assert.equal(row.targetDisposition, "owner_migration_reserve_after_v1_recovery");
    assert.notEqual(row.targetAddress?.toLowerCase(), row.sourceAddress.toLowerCase());
    assert.equal(row.executionAuthorized, false);
  });

  it("keeps team and combined marketing/staking ownership economically unchanged", function () {
    const rows = migration.migrationPlan?.rows ?? [];
    const team = rows.find((entry) => entry.sourceRole === "team");
    const combined = rows.find((entry) => entry.sourceRole === "marketing_and_staking");

    assert.equal(team.targetAddress.toLowerCase(), team.sourceAddress.toLowerCase());
    assert.equal(tokens(team.targetTokens), 200_000_000n);
    assert.equal(combined.targetAddress.toLowerCase(), combined.sourceAddress.toLowerCase());
    assert.equal(tokens(combined.targetTokens), 300_000_000n);
    assert.deepEqual(combined.v2AllocationComponents, {
      marketingTokens: "150000000",
      stakingTokens: "150000000",
    });
  });

  it("requires an immutable no-recovery lock contract and keeps every execution gate false", function () {
    assert.equal(fs.existsSync(lockUrl), true);
    if (fs.existsSync(lockUrl)) {
      const lockSource = fs.readFileSync(lockUrl, "utf8");
      assert.match(lockSource, /contract\s+AetheronPermanentSupplyLock\s*\{\s*\}/s);
      assert.doesNotMatch(lockSource, /\bfunction\b/);
      assert.doesNotMatch(lockSource, /\bowner\b/i);
      assert.doesNotMatch(lockSource, /selfdestruct/i);
    }

    const evidence = migration.cutover.evidence;
    assert.equal(evidence.balanceMigrationPlanApproved, false);
    assert.equal(evidence.v1RecoveryVerified, false);
    assert.equal(evidence.permanentSupplyLockVerified, false);
    assert.equal(migration.migrationAuthorized, false);
    assert.equal(migration.cutover.authorized, false);
    assert.equal(migration.liquidityAuthorized, false);
    assert.equal(migration.publicLaunchAuthorized, false);
  });
});
