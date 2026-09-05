import assert from "node:assert/strict";
import test from "node:test";
import { providerReadWithRetry } from "../scripts/lib/base-read-retry.mjs";

test("provider balance reads accept a valid zero balance", async () => {
  const provider = {
    async getBalance(address) {
      assert.equal(address, "0x0000000000000000000000000000000000000001");
      return 0n;
    },
  };

  const balance = await providerReadWithRetry(provider, "getBalance", ["0x0000000000000000000000000000000000000001"], "Deployment wallet Base ETH balance", { attempts: 1, delayMs: 0 });
  assert.equal(balance, 0n);
});
test("stalled reads time out instead of hanging forever", async () => {
  const sentinel = Symbol("hung");
  const result = await Promise.race([
    providerReadWithRetry(
      { neverReturns: () => new Promise(() => {}) },
      "neverReturns",
      [],
      "Stalled Base RPC read",
      { attempts: 1, delayMs: 0, timeoutMs: 25 }
    ).then(
      () => ({ kind: "resolved" }),
      (error) => ({ kind: "rejected", message: error.message })
    ),
    new Promise((resolve) => setTimeout(() => resolve(sentinel), 150))
  ]);

  assert.notEqual(result, sentinel, "readWithRetry hung past its configured timeout");
  assert.equal(result.kind, "rejected");
  assert.match(result.message, /timed out after 25ms/);
});
