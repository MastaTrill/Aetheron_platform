import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { network } from "hardhat";

const production = JSON.parse(
  fs.readFileSync(new URL("../config/presale-base-production.json", import.meta.url), "utf8")
);

describe("Exact production presale simulation", { concurrency: false }, function () {
  it("deploys, funds, purchases, escrows, cancels, and refunds with production values", async function () {
    const { ethers } = await network.connect();
    const [owner, treasury, buyer] = await ethers.getSigners();

    const rate = BigInt(production.rateAethPerEth);
    const softCap = ethers.parseEther(production.softCapEth);
    const hardCap = ethers.parseEther(production.hardCapEth);
    const minimum = ethers.parseEther(production.minContributionEth);
    const maximum = ethers.parseEther(production.maxContributionEth);
    const fundingAmount = ethers.parseUnits(production.fundingAeth, 18);
    const startDelay = Number(production.startDelaySeconds);
    const duration = Number(production.durationSeconds);

    assert.equal(hardCap * rate, fundingAmount, "Production funding arithmetic must be exact");

    const Token = await ethers.getContractFactory("contracts/Aetheron.sol:Aetheron");
    const token = await Token.deploy(owner.address, owner.address, owner.address);
    await token.waitForDeployment();

    const latestBlock = await ethers.provider.getBlock("latest");
    assert.ok(latestBlock);
    const startTime = latestBlock.timestamp + startDelay;
    const endTime = startTime + duration;

    const Presale = await ethers.getContractFactory("AetheronPresaleV2");
    const presale = await Presale.deploy(
      await token.getAddress(),
      rate,
      softCap,
      hardCap,
      minimum,
      maximum,
      startTime,
      endTime,
      treasury.address
    );
    await presale.waitForDeployment();

    const presaleAddress = await presale.getAddress();
    await (await token.setExcludedFromTax(presaleAddress, true)).wait();
    await (await token.transfer(presaleAddress, fundingAmount)).wait();

    assert.equal(await token.balanceOf(presaleAddress), fundingAmount);
    assert.equal(await token.isExcludedFromTax(presaleAddress), true);
    assert.equal(await presale.owner(), owner.address);
    assert.equal(await presale.token(), await token.getAddress());
    assert.equal(await presale.treasury(), treasury.address);
    assert.equal(await presale.rate(), rate);
    assert.equal(await presale.softCap(), softCap);
    assert.equal(await presale.hardCap(), hardCap);
    assert.equal(await presale.minContribution(), minimum);
    assert.equal(await presale.maxContribution(), maximum);
    assert.equal(await presale.startTime(), BigInt(startTime));
    assert.equal(await presale.endTime(), BigInt(endTime));

    await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 1]);
    await ethers.provider.send("evm_mine");

    const expectedTokens = minimum * rate;
    await (await presale.connect(buyer).buyTokens({ value: minimum })).wait();

    assert.equal(await presale.weiRaised(), minimum);
    assert.equal(await presale.contributions(buyer.address), minimum);
    assert.equal(await presale.tokensOwed(buyer.address), expectedTokens);
    assert.equal(await presale.tokensReserved(), expectedTokens);
    assert.equal(await ethers.provider.getBalance(presaleAddress), minimum);
    assert.equal(await token.balanceOf(presaleAddress), fundingAmount);

    await (await presale.cancel()).wait();
    assert.equal(await presale.refundsAvailable(), true);

    const contractBalanceBeforeRefund = await ethers.provider.getBalance(presaleAddress);
    await (await presale.connect(buyer).claimRefund()).wait();

    assert.equal(await presale.contributions(buyer.address), 0n);
    assert.equal(await presale.tokensOwed(buyer.address), 0n);
    assert.equal(await presale.tokensReserved(), 0n);
    assert.equal(await ethers.provider.getBalance(presaleAddress), contractBalanceBeforeRefund - minimum);
    assert.equal(await token.balanceOf(presaleAddress), fundingAmount);
  });
});
