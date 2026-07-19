import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ethers } from "ethers";

const production = JSON.parse(fs.readFileSync(new URL("../config/presale-base-production.json", import.meta.url), "utf8"));
const deployment = JSON.parse(fs.readFileSync(new URL("../deployments/presale-base.json", import.meta.url), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const boundedEntrypointSource = fs.readFileSync(new URL("../scripts/deploy-base-presale-bounded.mjs", import.meta.url), "utf8");
const productionGuardSource = fs.readFileSync(new URL("../scripts/deploy-base-presale-production.mjs", import.meta.url), "utf8");
const stateVerifierSource = fs.readFileSync(new URL("../scripts/verify-base-presale-state.mjs", import.meta.url), "utf8");
const presaleSource = fs.readFileSync(new URL("../contracts/AetheronPresale.sol", import.meta.url), "utf8");
const rootFrontendSource = fs.readFileSync(new URL("../../presale-config.js", import.meta.url), "utf8");
const legacyMainnetSource = fs.readFileSync(new URL("../scripts/deploy-mainnet.mjs", import.meta.url), "utf8");
const localDeployerSource = fs.readFileSync(new URL("../scripts/start-presale-local.mjs", import.meta.url), "utf8");
const operationsGuideSource = fs.readFileSync(new URL("../../PRESALE_GUIDE.md", import.meta.url), "utf8");
const duplicateFrontendUrl = new URL("../presale-config.js", import.meta.url);
const staleVerificationInputUrl = new URL("../../presale-verification-input.json", import.meta.url);

function isTransactionHash(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(value || "");
}

test("Base production addresses and chain are fixed", () => {
  assert.equal(production.chainId, 8453);
  assert.equal(production.network, "base");
  assert.ok(ethers.isAddress(production.tokenAddress));
  assert.ok(ethers.isAddress(production.treasuryAddress));
  assert.equal(production.tokenAddress.toLowerCase(), "0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e");
  assert.equal(production.treasuryAddress.toLowerCase(), "0x15b9f8ecedafd69eb1dd93e51fe522690bf6b7c2");
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

test("frontend config matches the approved Base terms and recorded launch state", () => {
  assert.match(rootFrontendSource, new RegExp(`aethTokenAddress: ["']${production.tokenAddress}["']`));
  if (deployment.launchable) {
    assert.match(rootFrontendSource, new RegExp(`presaleContractAddress: ["']${deployment.contracts.Presale.address}["']`));
    assert.match(rootFrontendSource, /status:\s*["']live["']/);
  } else {
    assert.match(rootFrontendSource, /presaleContractAddress:\s*["']["']/);
    assert.match(
      rootFrontendSource,
      /status:\s*["'](?:disabled-awaiting-replacement-deployment|disabled-awaiting-basescan-and-owner-smoke-test|verified-disabled-awaiting-owner-smoke-test)["']/
    );
  }
  assert.match(rootFrontendSource, /network:\s*["']base["']/);
  assert.match(rootFrontendSource, /chainId:\s*8453/);
  assert.match(rootFrontendSource, new RegExp(`minContribution:\\s*${production.minContributionEth.replace(".", "\\.")}`));
  assert.match(rootFrontendSource, new RegExp(`maxContribution:\\s*${production.maxContributionEth}`));
  assert.doesNotMatch(rootFrontendSource, /maxContribution:\s*100(?:\D|$)/);
  assert.equal(fs.existsSync(duplicateFrontendUrl), false, "Only the root presale-config.js may be canonical");
});

test("deployment journal preserves accounting or a recoverable non-launchable state", () => {
  if (deployment.supplyAccounting) {
    const locked = BigInt(deployment.supplyAccounting.lockedAtInvalidPresale);
    const nominal = BigInt(deployment.supplyAccounting.nominalTotalSupply);
    const maximumAccessible = BigInt(deployment.supplyAccounting.maximumInterfaceAccessibleSupply);
    assert.equal(nominal - locked, maximumAccessible);
    assert.ok(BigInt(production.saleAllocationAeth) <= maximumAccessible);
    assert.equal(locked, 50_000_000n);
    return;
  }

  if (deployment.launchable) {
    assert.equal(deployment.safety?.frontendEnabled, true);
    assert.equal(deployment.frontend?.publicPurchaseAddressEnabled, true);
    assert.equal(deployment.frontend?.status, "live");
    assert.ok(ethers.isAddress(deployment.contracts?.Presale?.address));
    assert.ok(isTransactionHash(deployment.transactions?.smokePurchase?.hash));
    assert.equal(BigInt(deployment.transactions.smokePurchase.amountWei), ethers.parseEther(production.ownerSmokePurchaseEth));
    assert.equal(BigInt(deployment.verifiedState?.weiRaised), ethers.parseEther(production.ownerSmokePurchaseEth));
    assert.equal(
      BigInt(deployment.verifiedState?.tokensReserved),
      ethers.parseEther(production.ownerSmokePurchaseEth) * BigInt(production.rateAethPerEth)
    );
    return;
  }

  assert.equal(deployment.launchable, false);
  assert.equal(deployment.safety?.frontendEnabled, false);
  assert.equal(
    deployment.contracts?.InvalidPresale?.address?.toLowerCase(),
    "0xa7aa360d2f00cf4130b3244d0a13ae32a49ab07c"
  );

  const presaleAddress = deployment.contracts?.Presale?.address ?? null;
  const transactions = deployment.transactions ?? {};
  if (presaleAddress === null) {
    assert.deepEqual(transactions, {});
    assert.match(
      deployment.status,
      /^(deploying-presale-contract|deployment-failed|deployment-failed-before-broadcast|invalid-token-mismatch)$/
    );
    return;
  }

  assert.ok(ethers.isAddress(presaleAddress));
  assert.ok(isTransactionHash(transactions.deploy?.hash));
  for (const name of ["excludeFromTax", "fund"]) {
    if (transactions[name]) assert.ok(isTransactionHash(transactions[name].hash));
  }
  assert.match(
    deployment.status,
    /^(presale-deployment-broadcast-awaiting-confirmation|presale-deployed-pending-token-setup|presale-deployed-tax-exclusion-broadcast-awaiting-confirmation|presale-deployed-tax-excluded-pending-funding|presale-funding-broadcast-awaiting-confirmation|presale-funded-pending-state-verification|deployed-funded-state-verified-awaiting-basescan|deployed-verified-awaiting-owner-smoke-purchase)$/
  );
});

test("all production deployment entry points use the bounded wrapper around the invariant guard", () => {
  const boundedCommand = "node scripts/deploy-base-presale-bounded.mjs";
  assert.equal(packageJson.scripts["deploy:presale"], boundedCommand);
  assert.equal(packageJson.scripts["deploy:presale:base:safe"], boundedCommand);
  assert.match(packageJson.scripts["deploy:base-presale:dry-run"], /deploy-base-presale-bounded\.mjs/);
  assert.match(boundedEntrypointSource, /await import\("\.\/deploy-base-presale-production\.mjs"\)/);
  assert.match(boundedEntrypointSource, /DEFAULT_DEPLOY_GAS_LIMIT = 12_000_000n/);
  assert.match(boundedEntrypointSource, /presale-deployment-broadcast-awaiting-confirmation/);
  assert.match(productionGuardSource, /Invalid presale must be cancelled before replacement deployment/);
  assert.match(productionGuardSource, /Production presale rate was modified/);
  assert.match(productionGuardSource, /Protected signer is not the approved Base owner\/treasury wallet/);
});

test("obsolete deployment and verification paths are disabled", () => {
  assert.match(legacyMainnetSource, /legacy Polygon mainnet presale deployer is disabled/);
  assert.match(legacyMainnetSource, /Deploy Corrected Base Presale/);
  assert.doesNotMatch(legacyMainnetSource, /0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e/i);
  assert.doesNotMatch(legacyMainnetSource, /ContractFactory|factory\.deploy/);
  assert.equal(fs.existsSync(staleVerificationInputUrl), false);
  assert.match(operationsGuideSource, /Aetheron Base Presale Operations Guide/);
  assert.match(operationsGuideSource, /Deploy Corrected Base Presale/);
  assert.doesNotMatch(operationsGuideSource, /PRESALE_MAX_MATIC|presale-polygon\.json/);
});

test("local presale deployment uses the current constructor and cannot enable the public frontend", () => {
  assert.match(localDeployerSource, /const RATE = 1_000_000n/);
  assert.match(localDeployerSource, /const MAX_CONTRIBUTION = ethers\.parseEther\("1"\)/);
  assert.match(localDeployerSource, /const fundingAmount = HARD_CAP \* RATE/);
  assert.match(localDeployerSource, /endTime,\s*wallet\.address\s*\)/s);
  assert.doesNotMatch(localDeployerSource, /writeFileSync\(["']\.\.\/\.\.\/presale-config\.js/);
  assert.match(localDeployerSource, /public presale-config\.js was not modified/);
});

test("production guard retries transient Base reads before deployment", () => {
  assert.match(productionGuardSource, /const VIEW_RETRY_ATTEMPTS = 5/);
  assert.match(productionGuardSource, /async function readViewWithRetry/);
  assert.match(productionGuardSource, /async function readProviderWithRetry/);
  assert.match(productionGuardSource, /Invalid presale token\(\)/);
  assert.match(productionGuardSource, /Recorded invalid presale bytecode/);
  assert.doesNotMatch(productionGuardSource, /Promise\.all\(\[\s*invalidPresale\.owner\(\),\s*invalidPresale\.token\(\)/);

  const tokenReadIndex = productionGuardSource.indexOf('readViewWithRetry(invalidPresale, "token", "Invalid presale token()")');
  const bytecodeReadIndex = productionGuardSource.indexOf('"getCode"');
  const deploymentImportIndex = productionGuardSource.indexOf('await import("./deploy-base-presale-safe.mjs")');
  assert.ok(bytecodeReadIndex >= 0);
  assert.ok(tokenReadIndex >= 0);
  assert.ok(deploymentImportIndex > tokenReadIndex);
});

test("post-deployment verification accepts a fully funded disabled replacement", () => {
  assert.equal(packageJson.scripts["verify:base:readonly"], "node scripts/verify-base-presale-state.mjs");
  assert.match(stateVerifierSource, /safeDisabledState/);
  assert.match(stateVerifierSource, /SAFE_DISABLED_STATE/);
  assert.doesNotMatch(stateVerifierSource, /Deployment record is explicitly marked non-launchable/);
});

test("owner-controlled terms lock when the advertised sale starts", () => {
  assert.match(presaleSource, /modifier onlyBeforeSaleStart\(\)/);
  assert.match(
    presaleSource,
    /function updateRate\(uint256\s+[A-Za-z_][A-Za-z0-9_]*\)\s+external\s+onlyOwner\s+onlyBeforeSaleStart/
  );
  assert.match(
    presaleSource,
    /function updateSchedule\(uint256\s+[A-Za-z_][A-Za-z0-9_]*,\s*uint256\s+[A-Za-z_][A-Za-z0-9_]*\)\s+external\s+onlyOwner\s+onlyBeforeSaleStart/
  );
});
