import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const source = fs.readFileSync(new URL("../contracts/AetheronV2.sol", import.meta.url), "utf8");
const deploySource = fs.readFileSync(new URL("../scripts/deploy-aeth-v2.mjs", import.meta.url), "utf8");
const migration = JSON.parse(fs.readFileSync(new URL("../deployments/aeth-v2-migration.json", import.meta.url), "utf8"));

describe("AETH V2 standard ERC20 policy", function () {
  it("has no transfer-tax or AMM-specific token logic", function () {
    assert.doesNotMatch(source, /buyTaxRate/);
    assert.doesNotMatch(source, /sellTaxRate/);
    assert.doesNotMatch(source, /TaxCollected/);
    assert.doesNotMatch(source, /isAutomatedMarketMakerPair/);
    assert.doesNotMatch(source, /setAutomatedMarketMakerPair/);
    assert.equal(migration.v2.transferTaxBps, 0);
    assert.equal(migration.v2.transferTaxPolicy, "none");
  });

  it("records and verifies the standard ERC20 policy during deployment", function () {
    assert.doesNotMatch(deploySource, /buyTaxRate/);
    assert.doesNotMatch(deploySource, /sellTaxRate/);
    assert.match(deploySource, /transferTaxBps:\s*0/);
    assert.match(deploySource, /transferTaxPolicy:\s*"none"/);
  });
});
