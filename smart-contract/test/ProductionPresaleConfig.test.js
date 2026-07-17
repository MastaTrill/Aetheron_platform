import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ethers } from "ethers";

const production = JSON.parse(
  fs.readFileSync(new URL("../config/presale-base-production.json", import.meta.url), "utf8")
);
const deployment = JSON.parse(
  fs.readFileSync(new URL("../deployments/presale-base.json", import.meta.url), "utf8")
);
const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
const productionGuardSource = fs.readFileSync(
  new URL("../scripts/deploy-base-presale-production.mjs", import.meta.url),
  "utf8"
);
const stateVerifierSource = fs.readFileSync(
  new URL("../scripts/verify-base-presale-state.mjs", import.meta.url),
  "utf8"
);
const presaleSource = fs.readFileSync(
  new URL("../contracts/AetheronPresale.sol", import.meta.url),
  "utf8"
);

test("Base production addresses and chain are fixed", () => {
  assert.equal(production.chainId, 8453);
  assert.equal(production.network, "base");
  assert.ok(ethers.isAddress(production.tokenAddress));
  assert.ok(ethers.isAddress(production.treasuryAddress));
  assert.equal(
    production.tokenAddress.toLowerCase(),
    "0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e"
  );
  assert.equal(
    production.treasuryAddress.toLowerCase(),
    "0x15b9f8ecedafd69eb1dd93e51fe522690bf6b7c2"
  );
});

test("hard cap and rate fund exactly the configured sale allocation", () => {
  const hardCapWei = ethers.parseEther(production.hardCapEth);
  const fundingUnits = hardCapWei * BigInt(production.rateAethPerEth);
  const allocationUnits = ethers.parseUnits(production.saleAllocationAeth, 18);
  const recordedFundingUnits = ethers.parseUnits(production.fundingAeth, 18);
  assert.equal(fundingUnits, allocationUnits);
  assert.equal(fundingUnits, recordedFundingUnits);
});

test("contribution limits and schedule satisfy deployment guards", () => {
  const softCap = ethers.parseEther(production.softCapEth);
  const hardCap = ethers.parseEther(production.hardCapEth);
  const minimum = ethers.parseEther(production.minContributionEth);
  const maximum = ethers.parseEther(production.maxContributionEth);
  assert.ok(softCap > 0n && softCap <= hardCap);
  assert.ok(minimum > 0n && minimum <= maximum);
  assert.ok(Number(production.startDelaySeconds) >= 3600);
  assert.ok(Number(production.durationSeconds) >= 86400);
  assert.equal(production.ownerSmokePurchaseEth, production.minContributionEth);
});

test("locked invalid-presale AETH is excluded from replacement inventory", () => {
  const locked = BigInt(deployment.supplyAccounting.lockedAtInvalidPresale);
  const nominal = BigInt(deployment.supplyAccounting.nominalTotalSupply);
  const maximumAccessible = BigInt(deployment.supplyAccounting.maximumInterfaceAccessibleSupply);
  const replacementAllocation = BigInt(production.saleAllocationAeth);
  assert.equal(nominal - locked, maximumAccessible);
  assert.ok(replacementAllocation <= maximumAccessible);
  assert.equal(locked, 50_000_000n);
});

test("all production deployment entry points use the invariant guard", () => {
  const guardedCommand = "node scripts/deploy-base-presale-production.mjs";
  assert.equal(packageJson.scripts["deploy:presale"], guardedCommand);
  assert.equal(packageJson.scripts["deploy:presale:base:safe"], guardedCommand);
  assert.match(packageJson.scripts["deploy:base-presale:dry-run"], /deploy-base-presale-production\.mjs/);
  assert.match(productionGuardSource, /Invalid presale must be cancelled before replacement deployment/);
  assert.match(productionGuardSource, /Production presale rate was modified/);
  assert.match(productionGuardSource, /Protected signer is not the approved Base owner\/treasury wallet/);
});

test("post-deployment verification accepts a fully funded disabled replacement", () => {
  assert.equal(packageJson.scripts["verify:base:readonly"], "node scripts/verify-base-presale-state.mjs");
  assert.match(stateVerifierSource, /safeDisabledState/);
  assert.match(stateVerifierSource, /SAFE_DISABLED_STATE/);
  assert.doesNotMatch(stateVerifierSource, /Deployment record is explicitly marked non-launchable/);
});

test("owner-controlled terms lock when the advertised sale starts", () => {
  assert.match(presaleSource, /modifier onlyBeforeSaleStart\(\)/);
  assert.match(presaleSource, /function updateRate\(uint256 _rate\) external onlyOwner onlyBeforeSaleStart/);
  assert.match(presaleSource, /function updateSchedule\(uint256 _startTime, uint256 _endTime\) external onlyOwner onlyBeforeSaleStart/);
});
