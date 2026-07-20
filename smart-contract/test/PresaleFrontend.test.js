import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = await fs.readFile(path.resolve(__dirname, "../../presale.js"), "utf8");
const readinessSource = await fs.readFile(path.resolve(__dirname, "../../presale-readiness.js"), "utf8");
const configSource = await fs.readFile(path.resolve(__dirname, "../../presale-config.js"), "utf8");

describe("presale frontend safety invariants", function () {
  it("is valid JavaScript", function () {
    assert.doesNotThrow(() => new vm.Script(source, { filename: "presale.js" }));
    assert.doesNotThrow(() => new vm.Script(readinessSource, { filename: "presale-readiness.js" }));
    assert.doesNotThrow(() => new vm.Script(configSource, { filename: "presale-config.js" }));
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
    assert.match(source, /requestedTokens > availablePurchaseTokens/);
  });

  it("enforces the contract's cumulative per-wallet contribution limit", function () {
    assert.match(source, /presaleContract\.contributions\(await signer\.getAddress\(\)\)/);
    assert.match(source, /maxContributionETH - userContributionETH/);
  });

  it("bounds Base readiness calls and fails over across published RPCs", function () {
    assert.match(readinessSource, /const RPC_TIMEOUT_MS/);
    assert.match(readinessSource, /Promise\.race\(\[promise, timeout\]\)/);
    assert.match(readinessSource, /async function createVerifiedProvider\(\)/);
    assert.match(readinessSource, /for \(const rpcUrl of RPC_CANDIDATES\)/);
    assert.match(readinessSource, /withTimeout\(loadPresaleData\(\), 'Presale state and inventory check'\)/);
    assert.match(configSource, /publicRpcUrls:\s*\[/);
    assert.match(configSource, /https:\/\/base-rpc\.publicnode\.com/);
    assert.match(configSource, /rpcTimeoutMs:\s*8000/);
  });

  it("fails closed with a user-visible retry instead of hanging", function () {
    assert.match(readinessSource, /presaleIsLive = false/);
    assert.match(readinessSource, /setPurchaseControlsEnabled\(false, 'Unavailable'\)/);
    assert.match(readinessSource, /retry\.textContent = 'Retry Base verification'/);
    assert.match(readinessSource, /retry\.addEventListener\('click', verifyReadOnlyState/);
  });
});
