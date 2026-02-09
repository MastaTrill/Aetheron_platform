const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AetheronPresale", function () {
  let AetheronPresale;
  let presale;
  let Aetheron;
  let token;
  let owner;
  let addr1;
  let addr2;
  const RATE = 1000; // 1 MATIC = 1000 Tokens
  const MAX_TOKENS = ethers.parseEther("40000000");
  const MAX_WEI = ethers.parseEther("33333.333333333333333333");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Token first
    Aetheron = await ethers.getContractFactory("Aetheron");
    // Mock addresses for team/marketing/staking for the token constructor
    token = await Aetheron.deploy(owner.address, owner.address, owner.address);

    // Deploy Presale
    AetheronPresale = await ethers.getContractFactory("AetheronPresale");
    presale = await AetheronPresale.deploy(await token.getAddress(), RATE, MAX_TOKENS, MAX_WEI);

    // Exclude presale from tax/trading restrictions
    await token.setExcludedFromTax(await presale.getAddress(), true);

    // Fund the presale contract with some tokens
    const amountToFund = ethers.parseEther("1000000"); // 1M tokens
    await token.transfer(await presale.getAddress(), amountToFund);
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await presale.token()).to.equal(await token.getAddress());
    });

    it("Should set the correct rate", async function () {
      expect(await presale.rate()).to.equal(RATE);
    });

    it("Should default to active", async function () {
      expect(await presale.isPresaleActive()).to.equal(true);
    });

    it("Should set the caps", async function () {
      expect(await presale.maxTokensForSale()).to.equal(MAX_TOKENS);
      expect(await presale.maxWeiRaised()).to.equal(MAX_WEI);
    });
  });

  describe("Buying Tokens", function () {
    it("Should allow buying tokens with ETH/MATIC", async function () {
      const buyAmount = ethers.parseEther("1"); // 1 MATIC
      const expectedTokens = buyAmount * BigInt(RATE);

      // addr1 buys tokens
      await expect(presale.connect(addr1).buyTokens({ value: buyAmount }))
        .to.emit(presale, "TokensPurchased")
        .withArgs(addr1.address, buyAmount, expectedTokens);

      expect(await token.balanceOf(addr1.address)).to.equal(expectedTokens);
    });

    it("Should update weiRaised", async function () {
      const buyAmount = ethers.parseEther("1");
      await presale.connect(addr1).buyTokens({ value: buyAmount });
      expect(await presale.weiRaised()).to.equal(buyAmount);
    });

    it("Should fail if presale is paused", async function () {
      await presale.setPresaleStatus(false);
      await expect(
        presale.connect(addr1).buyTokens({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Presale is not active");
    });

    it("Should fail if amount is 0", async function () {
      await expect(
        presale.connect(addr1).buyTokens({ value: 0 })
      ).to.be.revertedWith("Wei amount is 0");
    });

    it("Should fail if hard cap is exceeded", async function () {
      const overCap = MAX_WEI + ethers.parseEther("1");
      await expect(
        presale.connect(addr1).buyTokens({ value: overCap })
      ).to.be.revertedWith("Presale hard cap reached");
    });

    it("Should fail if token cap is exceeded", async function () {
      const maxWeiHigh = ethers.parseEther("50000");
      const PresaleFactory = await ethers.getContractFactory("AetheronPresale");
      const presaleHighCap = await PresaleFactory.deploy(await token.getAddress(), RATE, MAX_TOKENS, maxWeiHigh);
      await token.setExcludedFromTax(await presaleHighCap.getAddress(), true);

      const amountToFund = ethers.parseEther("40000000");
      await token.transfer(await presaleHighCap.getAddress(), amountToFund);

      const maxTokensAsMatic = MAX_TOKENS / BigInt(RATE);
      const overTokens = maxTokensAsMatic + ethers.parseEther("1");
      await expect(
        presaleHighCap.connect(addr1).buyTokens({ value: overTokens })
      ).to.be.revertedWith("Presale token cap reached");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to toggle presale status", async function () {
      await presale.setPresaleStatus(false);
      expect(await presale.isPresaleActive()).to.equal(false);

      await presale.setPresaleStatus(true);
      expect(await presale.isPresaleActive()).to.equal(true);
    });

    it("Should only allow owner to set status", async function () {
      await expect(
        presale.connect(addr1).setPresaleStatus(false)
      ).to.be.revertedWithCustomError(presale, "OwnableUnauthorizedAccount");
    });
  });
});
