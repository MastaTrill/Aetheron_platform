import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const wrapperUrl = new URL("../scripts/deploy-base-presale-bounded.mjs", import.meta.url);

describe("Bounded production deployment entrypoint", () => {
  it("routes every production presale command through the bounded wrapper", () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonUrl, "utf8"));
    assert.equal(
      packageJson.scripts["deploy:presale:base:safe"],
      "node scripts/deploy-base-presale-bounded.mjs"
    );
    assert.equal(
      packageJson.scripts["deploy:base-presale:dry-run"],
      "DRY_RUN=true node scripts/deploy-base-presale-bounded.mjs"
    );
  });

  it("bounds every release transaction and journals each broadcast stage", () => {
    const source = fs.readFileSync(wrapperUrl, "utf8");
    assert.match(source, /DEFAULT_DEPLOY_GAS_LIMIT = 12_000_000n/);
    assert.match(source, /DEFAULT_TOKEN_SETUP_GAS_LIMIT = 1_000_000n/);
    assert.match(source, /DEFAULT_FUNDING_GAS_LIMIT = 1_000_000n/);
    assert.match(source, /remoteCreationEstimateBypassed: true/);
    assert.match(source, /kind = "deploy"/);
    assert.match(source, /kind = "excludeFromTax"/);
    assert.match(source, /kind = "fund"/);
    assert.match(source, /persistBroadcast\(kind, response\)/);
    assert.match(source, /presale-deployment-broadcast-awaiting-confirmation/);
    assert.match(source, /presale-deployed-tax-exclusion-broadcast-awaiting-confirmation/);
    assert.match(source, /presale-funding-broadcast-awaiting-confirmation/);
    assert.match(source, /contracts\.InvalidPresale/);
    assert.match(source, /safety\.frontendEnabled = false/);
  });

  it("is valid Node.js module syntax", () => {
    const result = spawnSync(process.execPath, ["--check", wrapperUrl.pathname], {
      encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});
