import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scriptPath = fileURLToPath(new URL("../scripts/verify-contracts.mjs", import.meta.url));

test("verification CLI preserves the Base Sepolia network selection", () => {
  const result = spawnSync(process.execPath, [scriptPath, "baseSepolia", "AetheronStaking"], {
    encoding: "utf8",
    env: { ...process.env, NETWORK: "" }
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Verification Run for network: baseSepolia/);
  assert.doesNotMatch(result.stdout, /Verification Run for network: base\r?\n/);
});
