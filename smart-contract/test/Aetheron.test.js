const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aetheron Token", function () {
  let aetheron;
  let owner, teamWallet, marketingWallet, stakingPool, user1, user2;
  
  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion
  
  beforeEach(async function () {
    [owner, teamWallet, marketingWallet, stakingPool, user1, user2] = await ethers.getSigners();
    
    const Aetheron = await ethers.getContractFactory("Aetheron");
    aetheron = await Aetheron.deploy(
      teamWallet.address,
      marketingWallet.address,
      stakingPool.address
    );
  });
  
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await aetheron.name()).to.equal("Aetheron");
      expect(await aetheron.symbol()).to.equal("AETH");
    });
    
    it("Should mint correct total supply", async function () {
      const totalSupply = await aetheron.totalSupply();
      expect(totalSupply).to.equal(TOTAL_SUPPLY);
    });
    
    it("Should distribute tokens correctly", async function () {
      const ownerBalance = await aetheron.balanceOf(owner.address);
      const teamBalance = await aetheron.balanceOf(teamWallet.address);
      const marketingBalance = await aetheron.balanceOf(marketingWallet.address);
      const stakingBalance = await aetheron.balanceOf(stakingPool.address);
      
      expect(ownerBalance).to.equal(TOTAL_SUPPLY * 50n / 100n); // 50%
      expect(teamBalance).to.equal(TOTAL_SUPPLY * 20n / 100n); // 20%
      expect(marketingBalance).to.equal(TOTAL_SUPPLY * 15n / 100n); // 15%
      expect(stakingBalance).to.equal(TOTAL_SUPPLY * 15n / 100n); // 15%
    });
    
    it("Should set treasury wallets correctly", async function () {
      expect(await aetheron.teamWallet()).to.equal(teamWallet.address);
      expect(await aetheron.marketingWallet()).to.equal(marketingWallet.address);
      expect(await aetheron.stakingPool()).to.equal(stakingPool.address);
    });
  });
  
  describe("Trading Control", function () {
    it("Should not allow trading before enabled", async function () {
      await aetheron.transfer(user1.address, ethers.parseEther("1000"));
      
      await expect(
        aetheron.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Trading not enabled");
    });
    
    it("Should allow trading after enabled", async function () {
      await aetheron.transfer(user1.address, ethers.parseEther("1000"));
      await aetheron.enableTrading();
      
      await expect(
        aetheron.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.not.be.reverted;
    });
    
    it("Should only allow owner to enable trading", async function () {
      await expect(
        aetheron.connect(user1).enableTrading()
      ).to.be.reverted;
    });
    
    it("Should only enable trading once", async function () {
      await aetheron.enableTrading();
      
      await expect(
        aetheron.enableTrading()
      ).to.be.revertedWith("Trading already enabled");
    });
  });
  
  describe("Tax System", function () {
    beforeEach(async function () {
      await aetheron.enableTrading();
      await aetheron.transfer(user1.address, ethers.parseEther("10000"));
    });
    
    it("Should apply tax on transfers", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      const balanceBefore = await aetheron.balanceOf(user2.address);
      await aetheron.connect(user1).transfer(user2.address, transferAmount);
      const balanceAfter = await aetheron.balanceOf(user2.address);
      
      // Should receive less than sent due to tax
      expect(balanceAfter - balanceBefore).to.be.lt(transferAmount);
    });
    
    it("Should exclude specified addresses from tax", async function () {
      await aetheron.setExcludedFromTax(user1.address, true);
      
      const transferAmount = ethers.parseEther("1000");
      const balanceBefore = await aetheron.balanceOf(user2.address);
      
      await aetheron.connect(user1).transfer(user2.address, transferAmount);
      
      const balanceAfter = await aetheron.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(transferAmount);
    });
    
    it("Should allow owner to update tax rates", async function () {
      await aetheron.updateTaxRates(2, 3);
      
      expect(await aetheron.buyTaxRate()).to.equal(2);
      expect(await aetheron.sellTaxRate()).to.equal(3);
    });
    
    it("Should not allow tax rates above maximum", async function () {
      await expect(
        aetheron.updateTaxRates(11, 5)
      ).to.be.revertedWith("Buy tax too high");
      
      await expect(
        aetheron.updateTaxRates(5, 11)
      ).to.be.revertedWith("Sell tax too high");
    });
  });
  
  describe("Blacklist", function () {
    beforeEach(async function () {
      await aetheron.enableTrading();
      await aetheron.transfer(user1.address, ethers.parseEther("1000"));
    });
    
    it("Should prevent blacklisted addresses from transferring", async function () {
      await aetheron.setBlacklisted(user1.address, true);
      
      await expect(
        aetheron.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Blacklisted address");
    });
    
    it("Should prevent transfers to blacklisted addresses", async function () {
      await aetheron.setBlacklisted(user2.address, true);
      
      await expect(
        aetheron.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Blacklisted address");
    });
  });
  
  describe("Wallet Management", function () {
    it("Should allow owner to update wallets", async function () {
      await aetheron.updateWallets(user1.address, user2.address, stakingPool.address);
      
      expect(await aetheron.teamWallet()).to.equal(user1.address);
      expect(await aetheron.marketingWallet()).to.equal(user2.address);
    });
    
    it("Should not allow zero addresses for wallets", async function () {
      await expect(
        aetheron.updateWallets(ethers.ZeroAddress, user2.address, stakingPool.address)
      ).to.be.revertedWith("Invalid team wallet");
    });
  });
});
