const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AETH Token', function () {
  let Aetheron, aeth, owner, addr1;

  beforeEach(async function () {
    Aetheron = await ethers.getContractFactory('Aetheron');
    [owner, addr1] = await ethers.getSigners();
    aeth = await Aetheron.deploy(owner.address, owner.address, owner.address);
    await aeth.waitForDeployment();
  });

  it('Should assign the total supply to the owner', async function () {
    const ownerBalance = await aeth.balanceOf(owner.address);
    expect(await aeth.totalSupply()).to.equal(ownerBalance);
  });

  it('Should transfer tokens between accounts', async function () {
    await aeth.transfer(addr1.address, 100);
    expect(await aeth.balanceOf(addr1.address)).to.equal(100);
  });
});
