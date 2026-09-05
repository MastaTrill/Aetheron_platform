import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const verifierUrl = new URL("../scripts/verify-aeth-v1-migration-snapshot.mjs", import.meta.url);
const workflowUrl = new URL("../../.github/workflows/aeth-v2-migration-readiness.yml", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

describe("AETH V1 migration snapshot verifier", function () {
  it("ships a dedicated read-only verifier and CI gate", function () {
    assert.equal(fs.existsSync(verifierUrl), true);
    assert.equal(fs.existsSync(workflowUrl), true);

    const source = fs.readFileSync(verifierUrl, "utf8");
    const workflow = fs.readFileSync(workflowUrl, "utf8");
    const pkg = JSON.parse(fs.readFileSync(packageUrl, "utf8"));

    assert.equal(pkg.scripts["verify:aeth-v1-migration-snapshot"], "node scripts/verify-aeth-v1-migration-snapshot.mjs");
    assert.match(source, /aeth-v2-migration\.json/);
    assert.match(source, /balanceOf/);
    assert.match(source, /getBlockNumber/);
    assert.match(source, /readWithRetry/);
    assert.match(source, /process\.exitCode\s*=\s*1/);
    assert.doesNotMatch(source, /Wallet\s*\(/);
    assert.doesNotMatch(source, /PRIVATE_KEY/);
    assert.doesNotMatch(source, /sendTransaction/);

    assert.match(workflow, /verify:aeth-v1-migration-snapshot/);
    assert.match(workflow, /BASE_RPC_URL/);
    assert.doesNotMatch(workflow, /BASE_DEPLOYER_PRIVATE_KEY/);
    assert.doesNotMatch(workflow, /PRIVATE_KEY/);
  });
});
