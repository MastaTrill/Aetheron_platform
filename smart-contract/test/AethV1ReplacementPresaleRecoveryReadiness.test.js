import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const verifierUrl = new URL("../scripts/verify-aeth-v1-replacement-presale-recovery.mjs", import.meta.url);
const workflowUrl = new URL("../../.github/workflows/aeth-v2-migration-readiness.yml", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

describe("AETH V1 replacement presale recovery readiness", function () {
  it("ships a read-only contributor/refund/recovery verifier", function () {
    assert.equal(fs.existsSync(verifierUrl), true);

    const source = fs.readFileSync(verifierUrl, "utf8");
    const workflow = fs.readFileSync(workflowUrl, "utf8");
    const pkg = JSON.parse(fs.readFileSync(packageUrl, "utf8"));

    assert.equal(
      pkg.scripts["verify:aeth-v1-replacement-recovery"],
      "node scripts/verify-aeth-v1-replacement-presale-recovery.mjs",
    );
    assert.match(source, /contributions/);
    assert.match(source, /tokensOwed/);
    assert.match(source, /refunded/);
    assert.match(source, /refundsAvailable/);
    assert.match(source, /claimRefund/);
    assert.match(source, /withdrawUnsoldTokens/);
    assert.match(source, /staticCall/);
    assert.match(source, /ownerOnlyContributorScopeVerified/);
    assert.match(source, /recommendedSequence/);
    assert.doesNotMatch(source, /Wallet\s*\(/);
    assert.doesNotMatch(source, /PRIVATE_KEY/);
    assert.doesNotMatch(source, /sendTransaction/);

    assert.match(workflow, /verify:aeth-v1-replacement-recovery/);
    assert.match(workflow, /AETH_V1_RECOVERY_OUTPUT_PATH/);
    assert.doesNotMatch(workflow, /BASE_DEPLOYER_PRIVATE_KEY/);
  });
});
