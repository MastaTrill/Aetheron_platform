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

test("Base production addresses and chain are fixed", () => {
  assert.equal(production.chainId, 8453);
  assert.equal(production.network, "base");
  assert.ok(ethers.isAddress(production.tokenAddress));
  assert.ok(ethers.isAddress(production.treasuryAddress));
  assert.equal(
    production.tokenAddress.toLowerCase(),
    "0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e"
  );
});

test("hard cap and rate fund exactly the configured sale allocation", () => {
  const hardCapWei = ethers.parseEther(production.hardCapEth);
  const fundingUnits = hardCapWei * BigInt(production.rateAethPerEth);
  const allocationUnits = ethers.parseUnits(production.saleAllocationAeth, 18);
  assert.equal(fundingUnits, allocationUnits);
  assert.equal(ethers.formatUnits(fundingUnits, 18), production.fundingAeth);
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
