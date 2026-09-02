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
