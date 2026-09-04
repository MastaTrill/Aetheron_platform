import assert from "node:assert/strict";
import { describe, it, before, beforeEach } from "node:test";
import { network } from "hardhat";

describe("AetheronV2 — Base AMM tax safety", { concurrency: false }, function () {
  let ethers;
  let token;
  let owner, teamWallet, marketingWallet, stakingPool, pair, buyer, seller, recipient;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, teamWallet, marketingWallet, stakingPool, pair, buyer, seller, recipient] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("contracts/AetheronV2.sol:AetheronV2");
    token = await Factory.deploy(teamWallet.address, marketingWallet.address, stakingPool.address);
    await token.waitForDeployment();
  });

  it("preserves the intended 1B AETH supply allocation", async function () {
    const e = ethers.parseEther;
    assert.equal(await token.totalSupply(), e("1000000000"));
    assert.equal(await token.balanceOf(owner.address), e("500000000"));
    assert.equal(await token.balanceOf(teamWallet.address), e("200000000"));
    assert.equal(await token.balanceOf(marketingWallet.address), e("150000000"));
    assert.equal(await token.balanceOf(stakingPool.address), e("150000000"));
  });

  it("registers an AMM pair without making it tax-exempt", async function () {
    await token.setAutomatedMarketMakerPair(pair.address, true);
    assert.equal(await token.isAutomatedMarketMakerPair(pair.address), true);
    assert.equal(await token.isExcludedFromTax(pair.address), false);
  });

  it("prevents an active AMM pair from being tax-exempt", async function () {
    await token.setAutomatedMarketMakerPair(pair.address, true);
    await assert.rejects(
      () => token.setExcludedFromTax(pair.address, true),
      /AMM pair cannot be tax-exempt/
    );
  });

  it("rejects registering an already tax-exempt account as an AMM pair", async function () {
    await token.setExcludedFromTax(pair.address, true);
    await assert.rejects(
      () => token.setAutomatedMarketMakerPair(pair.address, true),
      /Tax-exempt account cannot be AMM pair/
    );
  });

  it("only lets the owner configure AMM pairs", async function () {
    await assert.rejects(
      () => token.connect(buyer).setAutomatedMarketMakerPair(pair.address, true),
      /Ownable: caller is not the owner/
    );
  });

  it("blocks public pair trading until the one-way trading gate is enabled", async function () {
    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.transfer(pair.address, ethers.parseEther("1000000"));
    await assert.rejects(
      () => token.connect(pair).transfer(buyer.address, ethers.parseEther("1000")),
      /Trading not enabled/
    );
  });

  it("applies exactly 3% tax to AMM buys after trading is enabled", async function () {
    const e = ethers.parseEther;
    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.transfer(pair.address, e("1000000"));
    await token.enableTrading();

    const amount = e("10000");
    const tax = (amount * 3n) / 100n;
    const teamTax = (tax * 40n) / 100n;
    const marketingTax = (tax * 30n) / 100n;
    const stakingTax = tax - teamTax - marketingTax;

    const teamBefore = await token.balanceOf(teamWallet.address);
    const marketingBefore = await token.balanceOf(marketingWallet.address);
    const stakingBefore = await token.balanceOf(stakingPool.address);

    await token.connect(pair).transfer(buyer.address, amount);

    assert.equal(await token.balanceOf(buyer.address), amount - tax);
    assert.equal(await token.balanceOf(teamWallet.address) - teamBefore, teamTax);
    assert.equal(await token.balanceOf(marketingWallet.address) - marketingBefore, marketingTax);
    assert.equal(await token.balanceOf(stakingPool.address) - stakingBefore, stakingTax);
  });

  it("applies exactly 5% tax to AMM sells after trading is enabled", async function () {
    const e = ethers.parseEther;
    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.transfer(seller.address, e("100000"));
    await token.enableTrading();

    const amount = e("10000");
    const tax = (amount * 5n) / 100n;
    const pairBefore = await token.balanceOf(pair.address);

    await token.connect(seller).transfer(pair.address, amount);

    assert.equal(await token.balanceOf(pair.address) - pairBefore, amount - tax);
  });

  it("keeps wallet-to-wallet transfers tax-free", async function () {
    const e = ethers.parseEther;
    await token.transfer(seller.address, e("5000"));
    await token.enableTrading();

    await token.connect(seller).transfer(recipient.address, e("1000"));
    assert.equal(await token.balanceOf(recipient.address), e("1000"));
  });

  it("keeps trading activation one-way", async function () {
    assert.equal(await token.tradingEnabled(), false);
    await token.enableTrading();
    assert.equal(await token.tradingEnabled(), true);
    await assert.rejects(() => token.enableTrading(), /Trading already enabled/);
  });
});
