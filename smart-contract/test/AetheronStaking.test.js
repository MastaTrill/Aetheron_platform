const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

describe("AetheronStaking", function () {
  let aetheron, staking;
  let owner, user1, user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const REWARD_AMOUNT = ethers.parseEther("100000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy token
    const Aetheron = await ethers.getContractFactory("Aetheron");
    aetheron = await Aetheron.deploy(owner.address, owner.address, owner.address);

    // Enable trading
    await aetheron.enableTrading();

    // Deploy staking
    const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
    staking = await AetheronStaking.deploy(await aetheron.getAddress());

    // Setup: transfer tokens to users and deposit rewards
    await aetheron.transfer(user1.address, INITIAL_SUPPLY);
    await aetheron.transfer(user2.address, INITIAL_SUPPLY);

    await aetheron.approve(await staking.getAddress(), REWARD_AMOUNT);
    await staking.depositRewards(REWARD_AMOUNT);

    // Exclude users from tax for testing
    await aetheron.setExcludedFromTax(user1.address, true);
    await aetheron.setExcludedFromTax(user2.address, true);
  });

  describe("Deployment", function () {
    it("Should create default pools", async function () {
      expect(await staking.poolCount()).to.equal(3);

      const pool0 = await staking.pools(0);
      expect(pool0.isActive).to.be.true;
      expect(pool0.lockDuration).to.equal(30 * 24 * 60 * 60); // 30 days
      expect(pool0.rewardRate).to.equal(500); // 5% APY
    });

    it("Should set correct token address", async function () {
      expect(await staking.aetheronToken()).to.equal(await aetheron.getAddress());
    });
  });

  describe("Pool Management", function () {
    it("Should allow owner to create new pools", async function () {
      await staking.createPool(365 * 24 * 60 * 60, 5000); // 1 year, 50% APY

      expect(await staking.poolCount()).to.equal(4);
      const pool = await staking.pools(3);
      expect(pool.isActive).to.be.true;
      expect(pool.rewardRate).to.equal(5000);
    });

    it("Should not allow reward rate above 100%", async function () {
      await expect(
        staking.createPool(30 * 24 * 60 * 60, 10001)
      ).to.be.revertedWith("Reward rate too high");
    });

    it("Should allow owner to deactivate pools", async function () {
      await staking.updatePoolStatus(0, false);

      const pool = await staking.pools(0);
      expect(pool.isActive).to.be.false;
    });
  });

  describe("Staking", function () {
    const stakeAmount = ethers.parseEther("1000");

    it("Should allow users to stake tokens", async function () {
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);

      await expect(
        staking.connect(user1).stake(0, stakeAmount)
      ).to.emit(staking, "Staked");

      expect(await staking.totalStaked()).to.equal(stakeAmount);
      expect(await staking.getUserStakesCount(user1.address)).to.equal(1);
    });

    it("Should not allow staking in inactive pools", async function () {
      await staking.updatePoolStatus(0, false);
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);

      await expect(
        staking.connect(user1).stake(0, stakeAmount)
      ).to.be.revertedWith("Pool not active");
    });

    it("Should not allow staking zero amount", async function () {
      await expect(
        staking.connect(user1).stake(0, 0)
      ).to.be.revertedWith("Cannot stake 0");
    });

    it("Should update pool totalStaked", async function () {
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(0, stakeAmount);

      const pool = await staking.pools(0);
      expect(pool.totalStaked).to.equal(stakeAmount);
    });
  });

  describe("Rewards", function () {
    const stakeAmount = ethers.parseEther("1000");

    beforeEach(async function () {
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(0, stakeAmount); // Pool 0: 30 days, 5% APY
    });

    it("Should calculate rewards correctly", async function () {
      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const reward = await staking.calculateReward(user1.address, 0);

      // Expected reward: (1000 * 5% / 365 days) * 30 days ≈ 4.11 AETH
      const expectedReward = stakeAmount * 500n * BigInt(30 * 24 * 60 * 60) / BigInt(365 * 24 * 60 * 60 * 10000);

      expect(reward).to.be.closeTo(expectedReward, ethers.parseEther("0.01"));
    });

    it("Should allow users to claim rewards", async function () {
      await time.increase(30 * 24 * 60 * 60);

      const balanceBefore = await aetheron.balanceOf(user1.address);

      await staking.connect(user1).claimRewards(0);

      const balanceAfter = await aetheron.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    // it("Should not allow claiming when no rewards", async function () {
    //   await expect(
    //     staking.connect(user1).claimRewards(0)
    //   ).to.be.revertedWith("No rewards available");
    // });

    it("Should update lastClaimTime after claiming", async function () {
      await time.increase(30 * 24 * 60 * 60);

      const stakeBefore = await staking.getUserStake(user1.address, 0);
      await staking.connect(user1).claimRewards(0);
      const stakeAfter = await staking.getUserStake(user1.address, 0);

      expect(stakeAfter.lastClaimTime).to.be.gt(stakeBefore.lastClaimTime);
    });
  });

  describe("Unstaking", function () {
    const stakeAmount = ethers.parseEther("1000");

    beforeEach(async function () {
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(0, stakeAmount); // Pool 0: 30 days
    });

    it("Should not allow unstaking before lock period", async function () {
      await expect(
        staking.connect(user1).unstake(0)
      ).to.be.revertedWith("Minimum staking period not met");
    });

    it("Should allow unstaking after lock period", async function () {
      await time.increase(30 * 24 * 60 * 60);

      const balanceBefore = await aetheron.balanceOf(user1.address);

      await expect(
        staking.connect(user1).unstake(0)
      ).to.emit(staking, "Unstaked");

      const balanceAfter = await aetheron.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.be.gte(stakeAmount);
    });

    it("Should claim rewards when unstaking", async function () {
      await time.increase(30 * 24 * 60 * 60);

      const balanceBefore = await aetheron.balanceOf(user1.address);
      await staking.connect(user1).unstake(0);
      const balanceAfter = await aetheron.balanceOf(user1.address);

      // Should receive original stake + rewards
      expect(balanceAfter - balanceBefore).to.be.gt(stakeAmount);
    });

    it("Should update totalStaked after unstaking", async function () {
      await time.increase(30 * 24 * 60 * 60);

      const totalBefore = await staking.totalStaked();
      await staking.connect(user1).unstake(0);
      const totalAfter = await staking.totalStaked();

      expect(totalBefore - totalAfter).to.equal(stakeAmount);
    });

    it("Should remove stake from user stakes", async function () {
      await time.increase(30 * 24 * 60 * 60);

      expect(await staking.getUserStakesCount(user1.address)).to.equal(1);
      await staking.connect(user1).unstake(0);
      expect(await staking.getUserStakesCount(user1.address)).to.equal(0);
    });
  });

  describe("Multiple Stakes", function () {
    const stakeAmount = ethers.parseEther("1000");

    it("Should allow multiple stakes from same user", async function () {
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount * 3n);

      await staking.connect(user1).stake(0, stakeAmount);
      await staking.connect(user1).stake(1, stakeAmount);
      await staking.connect(user1).stake(2, stakeAmount);

      expect(await staking.getUserStakesCount(user1.address)).to.equal(3);
    });

    it("Should track each stake independently", async function () {
      await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount * 2n);

      await staking.connect(user1).stake(0, stakeAmount);
      await time.increase(15 * 24 * 60 * 60); // 15 days
      await staking.connect(user1).stake(1, stakeAmount);

      const stake0 = await staking.getUserStake(user1.address, 0);
      const stake1 = await staking.getUserStake(user1.address, 1);

      expect(stake0.startTime).to.be.lt(stake1.startTime);
      expect(stake0.poolId).to.not.equal(stake1.poolId);
    });
  });

  describe("Reward Deposit", function () {
    it("Should allow owner to deposit rewards", async function () {
      const depositAmount = ethers.parseEther("10000");

      await aetheron.approve(await staking.getAddress(), depositAmount);

      await expect(
        staking.depositRewards(depositAmount)
      ).to.emit(staking, "RewardDeposited");

      expect(await staking.rewardBalance()).to.be.gte(REWARD_AMOUNT + depositAmount);
    });

    it("Should not allow depositing zero rewards", async function () {
      await expect(
        staking.depositRewards(0)
      ).to.be.revertedWith("Cannot deposit 0");
    });
  });
});
