import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = new URL("../scripts/deploy-aeth-v2.mjs", import.meta.url);
const manifestPath = new URL("../deployments/aeth-v2-migration.json", import.meta.url);
const legacy = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";

describe("AETH V2 deployment safety", function () {
  it("ships a syntactically valid, explicitly gated Base deployment script", function () {
    const source = fs.readFileSync(scriptPath, "utf8");
    const checked = spawnSync(process.execPath, ["--check", fileURLToPath(scriptPath)], { encoding: "utf8" });
    assert.equal(checked.status, 0, checked.stderr || checked.stdout);
    assert.match(source, /BASE_CHAIN_ID\s*=\s*8453/);
    assert.match(source, /CONFIRM_AETH_V2_DEPLOYMENT/);
    assert.match(source, /LIVE_ACTION/);
    assert.match(source, /DEPLOY_AETH_V2_ON_BASE/);
    assert.match(source, /AETH_V2_TEAM_WALLET/);
    assert.match(source, /AETH_V2_MARKETING_WALLET/);
    assert.match(source, /AETH_V2_STAKING_POOL/);
  });

  it("never auto-enables trading, configures an AMM pair, or funds a presale", function () {
    const source = fs.readFileSync(scriptPath, "utf8");
    assert.doesNotMatch(source, /\.enableTrading\s*\(/);
    assert.doesNotMatch(source, /\.setAutomatedMarketMakerPair\s*\(/);
    assert.doesNotMatch(source, /\.setPreLaunchTransferAgent\s*\(/);
    assert.doesNotMatch(source, /\.transfer\s*\(/);
    assert.doesNotMatch(source, /\.approve\s*\(/);
  });

  it("keeps V1 canonical and V2 explicitly undeployed until a real Base deployment exists", function () {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.equal(manifest.network, "Base Mainnet");
    assert.equal(manifest.chainId, 8453);
    assert.equal(manifest.legacyToken.address, legacy);
    assert.equal(manifest.legacyToken.status, "canonical_until_v2_cutover");
    assert.equal(manifest.v2.status, "prepared_not_deployed");
    assert.equal(manifest.v2.address, null);
    assert.equal(manifest.publicLaunchAuthorized, false);
    assert.equal(manifest.liquidityAuthorized, false);
    assert.equal(manifest.migrationAuthorized, false);
  });
});