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
    fundedTokens = ethers.parseEther("2000")
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
    await mineAt(startTime + 1);

    return { token, presale };
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
});
