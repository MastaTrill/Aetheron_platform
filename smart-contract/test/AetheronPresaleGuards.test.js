import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { network } from "hardhat";

describe("AetheronPresaleV2 purchase guards", { concurrency: false }, function () {
  let ethers, owner, treasury, buyer, secondBuyer;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, treasury, buyer, secondBuyer] = await ethers.getSigners();
  });

  async function latestTimestamp() {
    return Number((await ethers.provider.getBlock("latest")).timestamp);
  }

  async function mineAt(timestamp) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await ethers.provider.send("evm_mine");
  }

  async function deploy({
    rate = 1000n,
    softCap = ethers.parseEther("0.5"),
    hardCap = ethers.parseEther("2"),
    minContribution = ethers.parseEther("0.1"),
    maxContribution = ethers.parseEther("1"),
    fundedTokens = ethers.parseEther("2000"),
    mineToStart = true
  } = {}) {
    const Token = await ethers.getContractFactory("contracts/Aetheron.sol:Aetheron");
    const token = await Token.deploy(owner.address, owner.address, owner.address);
    await token.waitForDeployment();

    const startTime = (await latestTimestamp()) + 60;
    const endTime = startTime + 3600;
    const Presale = await ethers.getContractFactory("AetheronPresaleV2");
    const presale = await Presale.deploy(
      await token.getAddress(),
      rate,
      softCap,
      hardCap,
      minContribution,
      maxContribution,
      startTime,
      endTime,
      treasury.address
    );
    await presale.waitForDeployment();

    const presaleAddress = await presale.getAddress();
    await token.setExcludedFromTax(presaleAddress, true);
    await token.transfer(presaleAddress, fundedTokens);
    if (mineToStart) await mineAt(startTime + 1);

    return { token, presale, startTime, endTime };
  }

  it("enforces the cumulative per-wallet maximum", async function () {
    const { presale } = await deploy();
    await presale.connect(buyer).buyTokens({ value: ethers.parseEther("0.6") });

    await assert.rejects(
      () => presale.connect(buyer).buyTokens({ value: ethers.parseEther("0.5") }),
      /Exceeds per-wallet cap/
    );
  });

  it("rejects contributions above the remaining hard cap", async function () {
    const { presale } = await deploy({ maxContribution: ethers.parseEther("2") });
    await presale.connect(buyer).buyTokens({ value: ethers.parseEther("1.5") });

    await assert.rejects(
      () => presale.connect(secondBuyer).buyTokens({ value: ethers.parseEther("0.6") }),
      /Hard cap reached/
    );
  });

  it("rejects purchases that are not backed by token inventory", async function () {
    const { presale } = await deploy({
      fundedTokens: ethers.parseEther("100"),
      maxContribution: ethers.parseEther("2")
    });

    await assert.rejects(
      () => presale.connect(buyer).buyTokens({ value: ethers.parseEther("0.2") }),
      /Not enough tokens left in contract for this purchase/
    );
  });

  it("allows owner term corrections only before the advertised start", async function () {
    const { presale, startTime } = await deploy({ mineToStart: false });

    await presale.updateRate(2000n);
    await presale.updateCaps(ethers.parseEther("0.75"), ethers.parseEther("3"));
    await presale.updateContributionLimits(ethers.parseEther("0.05"), ethers.parseEther("1.5"));
    await presale.updateSchedule(startTime + 120, startTime + 3720);

    assert.equal(await presale.rate(), 2000n);
    assert.equal(await presale.softCap(), ethers.parseEther("0.75"));
    assert.equal(await presale.hardCap(), ethers.parseEther("3"));
    assert.equal(await presale.minContribution(), ethers.parseEther("0.05"));
    assert.equal(await presale.maxContribution(), ethers.parseEther("1.5"));
    assert.equal(await presale.startTime(), BigInt(startTime + 120));
  });

  it("locks all owner-controlled sale terms once the advertised start is reached", async function () {
    const { presale, startTime } = await deploy();

    await assert.rejects(() => presale.updateRate(2000n), /Sale terms are locked/);
    await assert.rejects(
      () => presale.updateCaps(ethers.parseEther("0.75"), ethers.parseEther("3")),
      /Sale terms are locked/
    );
    await assert.rejects(
      () => presale.updateContributionLimits(ethers.parseEther("0.05"), ethers.parseEther("1.5")),
      /Sale terms are locked/
    );
    await assert.rejects(
      () => presale.updateSchedule(startTime + 600, startTime + 4200),
      /Sale terms are locked/
    );
  });
});
