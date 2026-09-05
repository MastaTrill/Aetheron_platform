import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = await fs.readFile(path.resolve(__dirname, "../scripts/inspect-invalid-presale-recovery.mjs"), "utf8");

test("invalid presale inspection bounds the underlying RPC transport", () => {
  assert.match(source, /new ethers\.FetchRequest\(/);
  assert.match(source, /rpcRequest\.timeout\s*=\s*DEFAULT_READ_TIMEOUT_MS/);
  assert.match(source, /new ethers\.JsonRpcProvider\(\s*rpcRequest,/);
});