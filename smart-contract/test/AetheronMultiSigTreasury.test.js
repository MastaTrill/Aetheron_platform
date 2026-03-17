import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import hre from 'hardhat';
import { deployUupsProxy } from '../utils/uups.mjs';

const connection = await hre.network.connect();
const { ethers } = connection;

describe('AetheronMultiSigTreasury', { concurrency: false }, function () {
  let MultiSig, multiSig, owner, addr1, addr2, addr3;

  before(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    MultiSig = await ethers.getContractFactory('AetheronMultiSigTreasury');
    ({ instance: multiSig } = await deployUupsProxy(MultiSig, [
      [owner.address, addr1.address, addr2.address],
      2,
    ]));
  });

  it('should deploy with the owner set', async function () {
    assert.equal(await multiSig.owner(), owner.address);
  });

  it('should allow the owner to submit a transaction', async function () {
    const to = addr1.address;
    const value = ethers.parseEther('1');
    const data = '0x';
    const tx = await multiSig.submitTransaction(to, value, data);
    await tx.wait();

    assert.equal(await multiSig.getTransactionCount(), 1n);
    const transaction = await multiSig.getTransaction(0);

    assert.equal(transaction.to, to);
    assert.equal(transaction.value, value);
    assert.equal(transaction.executed, false);
  });

  it('should not allow non-owners to submit a transaction', async function () {
    const to = addr1.address;
    const value = ethers.parseEther('1');
    const data = '0x';
    let errorMessage = '';

    try {
      await multiSig.connect(addr1).submitTransaction(to, value, data);
    } catch (error) {
      errorMessage = error.message;
    }

    assert.match(errorMessage, /Ownable: caller is not the owner/);
  });
});
