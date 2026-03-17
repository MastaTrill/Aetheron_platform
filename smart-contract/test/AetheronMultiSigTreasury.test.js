// No setup import needed; Hardhat registers matchers
import { expect } from 'chai';
import pkg from 'hardhat';
const { ethers, upgrades } = pkg;

describe('AetheronMultiSigTreasury', function () {
  let MultiSig, multiSig, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    MultiSig = await ethers.getContractFactory('AetheronMultiSigTreasury');
    multiSig = await upgrades.deployProxy(
      MultiSig,
      [[owner.address, addr1.address, addr2.address], 2],
      { initializer: 'initialize' },
    );
  });

  it('should deploy with the owner set', async function () {
    expect(await multiSig.owner()).to.equal(owner.address);
  });

  it('should allow the owner to submit a transaction', async function () {
    const to = addr1.address;
    const value = ethers.utils.parseEther('1');
    const data = '0x';
    const tx = await multiSig.submitTransaction(to, value, data);
    const receipt = await tx.wait();

    const submitEvent = receipt.events.find(
      (event) => event.event === 'SubmitTransaction',
    );

    expect(submitEvent).to.not.equal(undefined);
  });

  it('should not allow non-owners to submit a transaction', async function () {
    const to = addr1.address;
    const value = ethers.utils.parseEther('1');
    const data = '0x';
    let errorMessage = '';

    try {
      await multiSig.connect(addr1).submitTransaction(to, value, data);
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).to.contain('Ownable: caller is not the owner');
  });
});
