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

describe("AETH V1 replacement presale recovery-completed mode", async function () {
  const { evaluateCompletedRecovery, parseRecoveryCompleted, TRANSFER_TOPIC, WITHDRAW_UNSOLD_SELECTOR } =
    await import("../scripts/lib/aeth-v1-recovery-completion.mjs");
  const { zeroPadValue, toBeHex } = await import("ethers");
  const migration = JSON.parse(fs.readFileSync(new URL("../deployments/aeth-v2-migration.json", import.meta.url), "utf8"));
  const plan = migration.migrationPlan.replacementPresaleRecovery;
  const owner = "0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2";
  const presale = "0xe0A3B6368312dFd3E7E76202e673f895f8235A3d";
  const token = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";
  const amount = 4900n * 10n ** 18n;

  function fixture(overrides = {}) {
    const completed = parseRecoveryCompleted(plan.recoveryCompleted, owner);
    const tx = { hash: completed.txHash, from: owner, to: presale, data: WITHDRAW_UNSOLD_SELECTOR };
    const receipt = {
      status: 1,
      blockNumber: completed.blockNumber,
      logs: [{ address: token, index: 0, data: toBeHex(amount, 32), topics: [TRANSFER_TOPIC, zeroPadValue(presale, 32), zeroPadValue(owner, 32)] }],
    };
    return { completed, tx, receipt, presaleAddress: presale, tokenAddress: token, owner, presaleBalance: 0n, ownerBalance: amount, ...overrides };
  }

  it("records the completed withdrawUnsoldTokens tx in the ledger and keeps pre-recovery history", function () {
    assert.equal(plan.recoveryCompleted.txHash, "0x95b85d8863adcde0ee5909390ef4bd13e7436946b03635e0de909549e670d66f");
    assert.equal(plan.recoveryCompleted.blockNumber, 53115030);
    assert.equal(plan.recoveryCompleted.amountTokens, "4900");
    assert.equal(plan.snapshotBalanceTokens, "4900");
    const source = fs.readFileSync(verifierUrl, "utf8");
    assert.match(source, /recoveryCompleted/);
    assert.match(source, /getTransactionReceipt/);
  });

  it("passes with matching mocked receipt and zero presale balance", function () {
    const result = evaluateCompletedRecovery(fixture());
    assert.match(result.txUrl, /basescan\.org\/tx\/0x95b85d88/);
  });

  it("fails if the presale still holds V1", function () {
    assert.throws(() => evaluateCompletedRecovery(fixture({ presaleBalance: 1n })), /must be 0/);
  });

  it("fails on reverted tx, wrong sender, wrong selector, or wrong amount", function () {
    const base = fixture();
    assert.throws(() => evaluateCompletedRecovery({ ...base, receipt: { ...base.receipt, status: 0 } }), /did not succeed/);
    assert.throws(() => evaluateCompletedRecovery({ ...base, tx: { ...base.tx, from: token } }), /not sent by the deployment owner/);
    assert.throws(() => evaluateCompletedRecovery({ ...base, tx: { ...base.tx, data: "0x12345678" } }), /not withdrawUnsoldTokens/);
    const badLog = { ...base.receipt.logs[0], data: toBeHex(amount - 1n, 32) };
    assert.throws(() => evaluateCompletedRecovery({ ...base, receipt: { ...base.receipt, logs: [badLog] } }), /exactly one V1 Transfer/);
    assert.throws(() => evaluateCompletedRecovery({ ...base, ownerBalance: amount - 1n }), /below recovered amount/);
  });
});
