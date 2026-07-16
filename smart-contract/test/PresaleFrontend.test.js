import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = await fs.readFile(path.resolve(__dirname, "../../presale.js"), "utf8");

describe("presale frontend safety invariants", function () {
  it("is valid JavaScript", function () {
    assert.doesNotThrow(() => new vm.Script(source, { filename: "presale.js" }));
  });

  it("defines network constants before selecting the configured network", function () {
    const baseIndex = source.indexOf("const BASE_NETWORK");
    const selectionIndex = source.indexOf("const NETWORK_CONFIG");
    assert.ok(baseIndex >= 0, "BASE_NETWORK is missing");
    assert.ok(selectionIndex > baseIndex, "NETWORK_CONFIG is selected before BASE_NETWORK is initialized");
  });

  it("uses the real hard cap rather than the soft cap", function () {
    assert.match(source, /const hardCapNative\s*=\s*parseFloat\(ethers\.utils\.formatEther\(hardCap\)\)/);
    assert.match(source, /hardCapETH\s*=\s*hardCapNative/);
    assert.doesNotMatch(source, /hardCapETH\s*=\s*softCapNative/);
  });

  it("does not put Solidity modifiers in human-readable ABI entries", function () {
    assert.doesNotMatch(source, /external onlyOwner/);
  });

  it("connects write operations to the wallet signer", function () {
    assert.match(source, /presaleContract\.connect\(signer\)/);
    assert.match(source, /presaleWithSigner\.claimRefund\(\)/);
  });

  it("performs a static simulation before submitting a purchase", function () {
    assert.match(source, /callStatic\.buyTokens/);
    assert.match(source, /estimateGas\.buyTokens/);
  });

  it("checks deployed token linkage and presale inventory", function () {
    assert.match(source, /tokenAddress\.toLowerCase\(\) !== AETH_TOKEN_ADDRESS\.toLowerCase\(\)/);
    assert.match(source, /tokenBalance\.lt\(tokensReserved\)/);
  });
});
