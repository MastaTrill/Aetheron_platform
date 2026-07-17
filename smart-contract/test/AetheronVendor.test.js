import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import { network } from 'hardhat';

describe('AetheronVendor', { concurrency: false }, function () {
  let ethers, token, vendor, owner, user1;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Token = await ethers.getContractFactory('contracts/Aetheron.sol:Aetheron');
    token = await Token.deploy(owner.address, owner.address, owner.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const Vendor = await ethers.getContractFactory('AetheronVendor');
    vendor = await Vendor.deploy(tokenAddress);
    await vendor.waitForDeployment();
    const vendorAddress = await vendor.getAddress();

    await token.setExcludedFromTax(vendorAddress, true);
    await token.enableTrading();

    await token.transfer(vendorAddress, ethers.parseEther('100000'));
  });

  describe('Deployment', function () {
    it('should set the correct token address', async function () {
      assert.equal(await vendor.aethToken(), await token.getAddress());
    });

    it('should start with the configured exchange rate', async function () {
      assert.equal(await vendor.tokensPerPol(), 10000n);
    });
  });

  describe('BuyTokens', function () {
    it('should allow buying tokens with POL', async function () {
      const purchaseValue = ethers.parseEther('1');
      await vendor.connect(user1).buyTokens({ value: purchaseValue });

      const userBalance = await token.balanceOf(user1.address);
      const expected = ethers.parseEther('10000');
      assert.equal(userBalance, expected);
    });

    it('should reject buying with zero POL', async function () {
      await assert.rejects(
        () => vendor.connect(user1).buyTokens({ value: 0 }),
        /Send POL to buy tokens/
      );
    });

    it('should allow buying tokens by sending POL directly to the contract', async function () {
      const purchaseValue = ethers.parseEther('1');
      await user1.sendTransaction({ to: await vendor.getAddress(), value: purchaseValue });

      const userBalance = await token.balanceOf(user1.address);
      const expected = ethers.parseEther('10000');
      assert.equal(userBalance, expected);
    });
  });

  describe('SellTokens', function () {
    it('should allow selling tokens for POL', async function () {
      const purchaseValue = ethers.parseEther('1');
      await vendor.connect(user1).buyTokens({ value: purchaseValue });

      const sellAmount = ethers.parseEther('10000');
      await token.connect(user1).approve(await vendor.getAddress(), sellAmount);

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vendor.connect(user1).sellTokens(sellAmount);
      const receipt = await tx.wait();
      const gasPrice = receipt.effectiveGasPrice ?? receipt.gasPrice;
      const gasCost = BigInt(receipt.gasUsed) * BigInt(gasPrice);

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      assert.equal(balanceAfter + gasCost, balanceBefore + purchaseValue);
    });

    it('should reject selling when allowance is insufficient', async function () {
      const purchaseValue = ethers.parseEther('1');
      await vendor.connect(user1).buyTokens({ value: purchaseValue });

      const sellAmount = ethers.parseEther('10000');
      await token.connect(user1).approve(await vendor.getAddress(), ethers.parseEther('1'));

      await assert.rejects(
        () => vendor.connect(user1).sellTokens(sellAmount),
        /Check the token allowance/
      );
    });

    it('should reject selling when vendor has insufficient POL', async function () {
      const purchaseValue = ethers.parseEther('1');
      await vendor.connect(user1).buyTokens({ value: purchaseValue });

      const sellAmount = ethers.parseEther('20000');
      await token.connect(user1).approve(await vendor.getAddress(), sellAmount);

      await assert.rejects(
        () => vendor.connect(user1).sellTokens(sellAmount),
        /Vendor has insufficient POL for buyback/
      );
    });
  });

  describe('Owner withdrawals', function () {
    it('should allow owner to withdraw collected POL', async function () {
      await vendor.connect(user1).buyTokens({ value: ethers.parseEther('1') });
      await vendor.withdrawPol();

      const vendorBalance = await ethers.provider.getBalance(await vendor.getAddress());
      assert.equal(vendorBalance, 0n);
    });

    it('should allow owner to withdraw remaining tokens', async function () {
      const vendorAddress = await vendor.getAddress();
      const vendorTokenBalanceBefore = await token.balanceOf(vendorAddress);

      await vendor.withdrawTokens();

      const vendorTokenBalanceAfter = await token.balanceOf(vendorAddress);
      assert.equal(vendorTokenBalanceAfter, 0n);
      assert.ok((await token.balanceOf(owner.address)) > 0n);
      assert.equal(vendorTokenBalanceAfter < vendorTokenBalanceBefore, true);
    });
  });

  describe('Rate management', function () {
    it('should allow owner to update the exchange rate', async function () {
      const tx = await vendor.setTokensPerPol(20000);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return vendor.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(parsed => parsed && parsed.name === 'TokensPerPolUpdated');

      assert.ok(event);
      assert.equal(event.args.newRate, 20000n);
      assert.equal(await vendor.tokensPerPol(), 20000n);
    });

    it('should reject non-owner from updating the exchange rate', async function () {
      await assert.rejects(
        () => vendor.connect(user1).setTokensPerPol(20000),
        /Ownable: caller is not the owner/
      );
    });

    it('should reject setting a zero exchange rate', async function () {
      await assert.rejects(() => vendor.setTokensPerPol(0), /Rate must be greater than zero/);
    });
  });
});
