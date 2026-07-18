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

  it("keeps contract creation bounded and journals every broadcast stage", () => {
    const source = fs.readFileSync(wrapperUrl, "utf8");
    assert.match(source, /DEFAULT_DEPLOY_GAS_LIMIT = 12_000_000n/);
    assert.match(source, /remoteCreationEstimateBypassed: true/);
    assert.match(source, /persistBroadcast\("deploy"/);
    assert.match(source, /persistBroadcast\("excludeFromTax"/);
    assert.match(source, /persistBroadcast\("fund"/);
    assert.match(source, /presale-deployment-broadcast-awaiting-confirmation/);
  });

  it("is valid Node.js module syntax", () => {
    const result = spawnSync(process.execPath, ["--check", wrapperUrl.pathname], {
      encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});
