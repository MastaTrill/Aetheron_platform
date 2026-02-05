const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

describe("AetheronStaking Minimal Revert Test", function () {
  let aetheron, staking, owner, user1;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const REWARD_AMOUNT = ethers.parseEther("100000");

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();
    const Aetheron = await ethers.getContractFactory("Aetheron");
    aetheron = await Aetheron.deploy(owner.address, owner.address, owner.address);
    await aetheron.enableTrading();
    const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
    staking = await AetheronStaking.deploy(await aetheron.getAddress());
    await aetheron.transfer(user1.address, INITIAL_SUPPLY);
    await aetheron.approve(await staking.getAddress(), REWARD_AMOUNT);
    await staking.depositRewards(REWARD_AMOUNT);
    await aetheron.setExcludedFromTax(user1.address, true);
  });

  it("Should revert with 'No rewards available' when claiming immediately after staking", async function () {
    const stakeAmount = ethers.parseEther("1000");
    await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(user1).stake(0, stakeAmount);
    const reward = await staking.calculateReward(user1.address, 0);
    console.log("[Minimal Test] Calculated reward before claim:", reward.toString());
    await expect(
      staking.connect(user1).claimRewards(0)
    ).to.be.revertedWith("No rewards available");
  });
});
