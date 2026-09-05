import assert from "node:assert/strict";
import { describe, it, before, beforeEach } from "node:test";
import { network } from "hardhat";

describe("AetheronV2 — Base launch invariants", { concurrency: false }, function () {
  let ethers;
  let token;
  let owner, teamWallet, marketingWallet, stakingPool, pair, buyer, seller, recipient, agent, prospectiveOwner;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, teamWallet, marketingWallet, stakingPool, pair, buyer, seller, recipient, agent, prospectiveOwner] = await ethers.getSigners();
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

  it("requires a pending owner to explicitly accept ownership", async function () {
    await token.transferOwnership(prospectiveOwner.address);
    assert.equal(await token.owner(), owner.address);
    assert.equal(await token.pendingOwner(), prospectiveOwner.address);
    await assert.rejects(() => token.connect(buyer).acceptOwnership(), /caller is not the new owner/i);
    await token.connect(prospectiveOwner).acceptOwnership();
    assert.equal(await token.owner(), prospectiveOwner.address);
    assert.equal(await token.pendingOwner(), ethers.ZeroAddress);
  });

  it("allows owner liquidity seeding before launch but blocks public transfers", async function () {
    const e = ethers.parseEther;
    await token.transfer(pair.address, e("1000000"));
    assert.equal(await token.balanceOf(pair.address), e("1000000"));
    await assert.rejects(() => token.connect(pair).transfer(buyer.address, e("1000")), /Trading not enabled/);
  });

  it("supports a bounded pre-launch transfer agent", async function () {
    const e = ethers.parseEther;
    await assert.rejects(() => token.connect(buyer).setPreLaunchTransferAgent(agent.address, true), /Ownable: caller is not the owner/);
    await assert.rejects(() => token.setPreLaunchTransferAgent(ethers.ZeroAddress, true), /Invalid transfer agent/);
    await token.setPreLaunchTransferAgent(agent.address, true);
    await token.transfer(agent.address, e("10000"));
    await token.connect(agent).transfer(recipient.address, e("1000"));
    assert.equal(await token.balanceOf(recipient.address), e("1000"));
  });

  it("blocks ordinary holder transfers until trading is enabled", async function () {
    const e = ethers.parseEther;
    await token.transfer(seller.address, e("5000"));
    await assert.rejects(() => token.connect(seller).transfer(recipient.address, e("1000")), /Trading not enabled/);
  });

  it("transfers the full amount after launch with no transfer tax", async function () {
    const e = ethers.parseEther;
    await token.transfer(seller.address, e("5000"));
    await token.enableTrading();

    const teamBefore = await token.balanceOf(teamWallet.address);
    const marketingBefore = await token.balanceOf(marketingWallet.address);
    const stakingBefore = await token.balanceOf(stakingPool.address);

    await token.connect(seller).transfer(recipient.address, e("1000"));

    assert.equal(await token.balanceOf(recipient.address), e("1000"));
    assert.equal(await token.balanceOf(teamWallet.address), teamBefore);
    assert.equal(await token.balanceOf(marketingWallet.address), marketingBefore);
    assert.equal(await token.balanceOf(stakingPool.address), stakingBefore);
  });

  it("transfers the full amount to an arbitrary DEX pool address after launch", async function () {
    const e = ethers.parseEther;
    await token.transfer(seller.address, e("5000"));
    await token.enableTrading();
    const pairBefore = await token.balanceOf(pair.address);
    await token.connect(seller).transfer(pair.address, e("1000"));
    assert.equal(await token.balanceOf(pair.address) - pairBefore, e("1000"));
  });

  it("preserves standard ERC20 approve and transferFrom behavior after launch", async function () {
    const e = ethers.parseEther;
    await token.transfer(seller.address, e("5000"));
    await token.enableTrading();
    await token.connect(seller).approve(buyer.address, e("1000"));
    await token.connect(buyer).transferFrom(seller.address, recipient.address, e("1000"));
    assert.equal(await token.balanceOf(recipient.address), e("1000"));
    assert.equal(await token.allowance(seller.address, buyer.address), 0n);
  });

  it("keeps trading activation one-way", async function () {
    assert.equal(await token.tradingEnabled(), false);
    await token.enableTrading();
    assert.equal(await token.tradingEnabled(), true);
    await assert.rejects(() => token.enableTrading(), /Trading already enabled/);
  });
});
