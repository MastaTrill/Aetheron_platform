import assert from "node:assert/strict";
import { describe, it, before, beforeEach } from "node:test";
import { network } from "hardhat";

describe("Aetheron Token — DEX Router Binding & Single-Pass Tax Execution", { concurrency: false }, function () {
  let ethers;
  let aetheron;
  let owner, teamWallet, marketingWallet, stakingPool, router, liquidityPool, buyer, seller, recipient;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, teamWallet, marketingWallet, stakingPool, router, liquidityPool, buyer, seller, recipient] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const AetheronFactory = await ethers.getContractFactory("contracts/Aetheron.sol:Aetheron");
    aetheron = await AetheronFactory.deploy(
      teamWallet.address,
      marketingWallet.address,
      stakingPool.address
    );
    await aetheron.waitForDeployment();

    // Enable trading
    await aetheron.enableTrading();
  });

  describe("1. DEX Router & Pool Binding", function () {
    it("should allow owner to configure QuickSwap router and exclude it from tax", async function () {
      await aetheron.setQuickSwapRouter(router.address);

      assert.equal(await aetheron.quickswapRouter(), router.address);
      assert.equal(await aetheron.isExcludedFromTax(router.address), true);
    });

    it("should allow owner to configure Liquidity Pool", async function () {
      await aetheron.setLiquidityPool(liquidityPool.address);

      assert.equal(await aetheron.liquidityPool(), liquidityPool.address);
    });

    it("should reject non-owner attempting to bind router or pool", async function () {
      await assert.rejects(
        () => aetheron.connect(buyer).setQuickSwapRouter(router.address),
        /Ownable: caller is not the owner/
      );

      await assert.rejects(
        () => aetheron.connect(buyer).setLiquidityPool(liquidityPool.address),
        /Ownable: caller is not the owner/
      );
    });
  });

  describe("2. Single-Pass Automated Tax Execution", function () {
    beforeEach(async function () {
      // Configure router and pool
      await aetheron.setQuickSwapRouter(router.address);
      await aetheron.setLiquidityPool(liquidityPool.address);

      // Ensure liquidity pool is not tax-exempt so swaps are subject to DEX tax
      await aetheron.setExcludedFromTax(liquidityPool.address, false);

      // Fund the liquidity pool from owner (owner is tax-exempt)
      await aetheron.transfer(liquidityPool.address, ethers.parseEther("1000000"));

      // Fund seller from owner
      await aetheron.transfer(seller.address, ethers.parseEther("100000"));
    });

    it("should apply exactly 3% buy tax when tokens are transferred from liquidity pool", async function () {
      const buyAmount = ethers.parseEther("10000");
      const expectedTax = (buyAmount * 3n) / 100n; // 300 AETH
      const expectedReceived = buyAmount - expectedTax; // 9700 AETH

      const teamTax = (expectedTax * 40n) / 100n; // 120 AETH
      const marketingTax = (expectedTax * 30n) / 100n; // 90 AETH
      const stakingTax = expectedTax - teamTax - marketingTax; // 90 AETH

      const teamBalBefore = await aetheron.balanceOf(teamWallet.address);
      const mktBalBefore = await aetheron.balanceOf(marketingWallet.address);
      const stakeBalBefore = await aetheron.balanceOf(stakingPool.address);

      // Simulate DEX Buy: pool sends tokens to buyer
      await aetheron.connect(liquidityPool).transfer(buyer.address, buyAmount);

      // Buyer receives exact net amount
      assert.equal(await aetheron.balanceOf(buyer.address), expectedReceived);

      // Tax distribution matches exact split
      assert.equal(await aetheron.balanceOf(teamWallet.address) - teamBalBefore, teamTax);
      assert.equal(await aetheron.balanceOf(marketingWallet.address) - mktBalBefore, marketingTax);
      assert.equal(await aetheron.balanceOf(stakingPool.address) - stakeBalBefore, stakingTax);
    });

    it("should apply exactly 5% sell tax when tokens are transferred to liquidity pool", async function () {
      const sellAmount = ethers.parseEther("10000");
      const expectedTax = (sellAmount * 5n) / 100n; // 500 AETH
      const expectedPoolReceived = sellAmount - expectedTax; // 9500 AETH

      const poolBalBefore = await aetheron.balanceOf(liquidityPool.address);

      // Simulate DEX Sell: seller sends tokens to pool
      await aetheron.connect(seller).transfer(liquidityPool.address, sellAmount);

      assert.equal(await aetheron.balanceOf(liquidityPool.address) - poolBalBefore, expectedPoolReceived);
    });

    it("should apply 0% tax on direct peer-to-peer (wallet-to-wallet) transfers", async function () {
      const transferAmount = ethers.parseEther("5000");

      const recipientBalBefore = await aetheron.balanceOf(recipient.address);
      const sellerBalBefore = await aetheron.balanceOf(seller.address);

      // Direct P2P transfer between non-DEX wallets
      await aetheron.connect(seller).transfer(recipient.address, transferAmount);

      assert.equal(await aetheron.balanceOf(recipient.address) - recipientBalBefore, transferAmount);
      assert.equal(sellerBalBefore - await aetheron.balanceOf(seller.address), transferAmount);
    });

    it("should apply 0% tax when sender or receiver is excluded", async function () {
      const transferAmount = ethers.parseEther("1000");

      // Owner transfers to buyer (0% tax)
      await aetheron.transfer(buyer.address, transferAmount);
      assert.equal(await aetheron.balanceOf(buyer.address), transferAmount);
    });
  });
});
