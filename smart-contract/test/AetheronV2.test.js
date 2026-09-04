import assert from "node:assert/strict";
import { describe, it, before, beforeEach } from "node:test";
import { network } from "hardhat";

describe("AetheronV2 — Base launch invariants", { concurrency: false }, function () {
  let ethers;
  let token;
  let owner, teamWallet, marketingWallet, stakingPool, pair, buyer, seller, recipient, agent, newTeam, newMarketing, newStaking;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, teamWallet, marketingWallet, stakingPool, pair, buyer, seller, recipient, agent, newTeam, newMarketing, newStaking] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("contracts/AetheronV2.sol:AetheronV2");
    token = await Factory.deploy(teamWallet.address, marketingWallet.address, stakingPool.address);
    await token.waitForDeployment();
  });

  it("preserves the intended 1B AETH supply allocation and fixed tax rates", async function () {
    const e = ethers.parseEther;
    assert.equal(await token.totalSupply(), e("1000000000"));
    assert.equal(await token.balanceOf(owner.address), e("500000000"));
    assert.equal(await token.balanceOf(teamWallet.address), e("200000000"));
    assert.equal(await token.balanceOf(marketingWallet.address), e("150000000"));
    assert.equal(await token.balanceOf(stakingPool.address), e("150000000"));
    assert.equal(await token.buyTaxRate(), 3n);
    assert.equal(await token.sellTaxRate(), 5n);
  });

  it("lets only the owner register valid AMM pairs", async function () {
    await assert.rejects(() => token.connect(buyer).setAutomatedMarketMakerPair(pair.address, true), /Ownable: caller is not the owner/);
    await assert.rejects(() => token.setAutomatedMarketMakerPair(ethers.ZeroAddress, true), /Invalid AMM pair/);
    await assert.rejects(() => token.setAutomatedMarketMakerPair(owner.address, true), /Owner cannot be AMM pair/);
    await token.setAutomatedMarketMakerPair(pair.address, true);
    assert.equal(await token.isAutomatedMarketMakerPair(pair.address), true);
  });

  it("allows owner liquidity seeding before launch but blocks public pair transfers", async function () {
    const e = ethers.parseEther;
    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.transfer(pair.address, e("1000000"));
    assert.equal(await token.balanceOf(pair.address), e("1000000"));
    await assert.rejects(() => token.connect(pair).transfer(buyer.address, e("1000")), /Trading not enabled/);
  });

  it("supports a bounded pre-launch transfer agent without granting post-launch tax exemption", async function () {
    const e = ethers.parseEther;
    await assert.rejects(() => token.connect(buyer).setPreLaunchTransferAgent(agent.address, true), /Ownable: caller is not the owner/);
    await token.setPreLaunchTransferAgent(agent.address, true);
    await token.transfer(agent.address, e("10000"));
    await token.connect(agent).transfer(recipient.address, e("1000"));
    assert.equal(await token.balanceOf(recipient.address), e("1000"));

    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.enableTrading();
    const pairBefore = await token.balanceOf(pair.address);
    await token.connect(agent).transfer(pair.address, e("1000"));
    assert.equal(await token.balanceOf(pair.address) - pairBefore, e("950"));
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
    const pairBefore = await token.balanceOf(pair.address);
    await token.connect(seller).transfer(pair.address, amount);
    assert.equal(await token.balanceOf(pair.address) - pairBefore, e("9500"));
  });

  it("taxes owner AMM trades after launch instead of preserving an admin fee bypass", async function () {
    const e = ethers.parseEther;
    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.enableTrading();
    const pairBefore = await token.balanceOf(pair.address);
    await token.transfer(pair.address, e("1000"));
    assert.equal(await token.balanceOf(pair.address) - pairBefore, e("950"));
  });

  it("keeps wallet-to-wallet transfers tax-free", async function () {
    const e = ethers.parseEther;
    await token.transfer(seller.address, e("5000"));
    await token.enableTrading();
    await token.connect(seller).transfer(recipient.address, e("1000"));
    assert.equal(await token.balanceOf(recipient.address), e("1000"));
  });

  it("lets only the owner rotate nonzero tax wallets and uses the new destinations", async function () {
    const e = ethers.parseEther;
    await assert.rejects(
      () => token.connect(buyer).updateTaxWallets(newTeam.address, newMarketing.address, newStaking.address),
      /Ownable: caller is not the owner/
    );
    await assert.rejects(
      () => token.updateTaxWallets(ethers.ZeroAddress, newMarketing.address, newStaking.address),
      /Invalid tax wallet/
    );

    await token.updateTaxWallets(newTeam.address, newMarketing.address, newStaking.address);
    assert.equal(await token.teamWallet(), newTeam.address);
    assert.equal(await token.marketingWallet(), newMarketing.address);
    assert.equal(await token.stakingPool(), newStaking.address);

    await token.setAutomatedMarketMakerPair(pair.address, true);
    await token.transfer(seller.address, e("1000"));
    await token.enableTrading();
    await token.connect(seller).transfer(pair.address, e("1000"));
    assert.equal(await token.balanceOf(newTeam.address), e("20"));
    assert.equal(await token.balanceOf(newMarketing.address), e("15"));
    assert.equal(await token.balanceOf(newStaking.address), e("15"));
  });

  it("keeps trading activation one-way", async function () {
    assert.equal(await token.tradingEnabled(), false);
    await token.enableTrading();
    assert.equal(await token.tradingEnabled(), true);
    await assert.rejects(() => token.enableTrading(), /Trading already enabled/);
  });
});
