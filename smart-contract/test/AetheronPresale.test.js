import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import { network } from 'hardhat';

describe('AetheronPresaleV2', { concurrency: false }, function () {
  let ethers, token, presale, owner, treasury, buyer;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, treasury, buyer] = await ethers.getSigners();
  });

  async function latestTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return Number(block.timestamp);
  }

  async function mineAt(timestamp) {
    await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp]);
    await ethers.provider.send('evm_mine');
  }

  async function deployPresale({
    rate = 1000n,
    softCap = ethers.parseEther('1'),
    hardCap = ethers.parseEther('5'),
    minContribution = ethers.parseEther('0.1'),
    maxContribution = ethers.parseEther('3'),
    fundedTokens = ethers.parseEther('5000'),
  } = {}) {
    const Token = await ethers.getContractFactory('contracts/Aetheron.sol:Aetheron');
    token = await Token.deploy(owner.address, owner.address, owner.address);
    await token.waitForDeployment();

    const now = await latestTimestamp();
    const startTime = now + 60;
    const endTime = startTime + 3600;

    const Presale = await ethers.getContractFactory('AetheronPresaleV2');
    presale = await Presale.deploy(
      await token.getAddress(),
      rate,
      softCap,
      hardCap,
      minContribution,
      maxContribution,
      startTime,
      endTime,
      treasury.address
    );
    await presale.waitForDeployment();

    const presaleAddress = await presale.getAddress();
    await token.setExcludedFromTax(presaleAddress, true);
    await token.transfer(presaleAddress, fundedTokens);

    return { startTime, endTime, presaleAddress };
  }

  beforeEach(async function () {
    await deployPresale();
  });

  it('reserves purchased tokens and releases them after finalization', async function () {
    const startTime = Number(await presale.startTime());
    const endTime = Number(await presale.endTime());
    const purchaseValue = ethers.parseEther('1');
    const expectedTokens = ethers.parseEther('1000');

    await mineAt(startTime + 1);
    await presale.connect(buyer).buyTokens({ value: purchaseValue });

    assert.equal(await presale.weiRaised(), purchaseValue);
    assert.equal(await presale.contributions(buyer.address), purchaseValue);
    assert.equal(await presale.tokensOwed(buyer.address), expectedTokens);
    assert.equal(await presale.tokensReserved(), expectedTokens);

    await mineAt(endTime + 1);
    await presale.finalize();
    await presale.connect(buyer).claimTokens();

    assert.equal(await presale.tokensOwed(buyer.address), 0n);
    assert.equal(await presale.tokensReserved(), 0n);
    assert.equal(await token.balanceOf(buyer.address), expectedTokens);
  });

  it('lets the owner withdraw only truly unsold tokens after finalized claims', async function () {
    const startTime = Number(await presale.startTime());
    const endTime = Number(await presale.endTime());
    const purchaseValue = ethers.parseEther('1');

    await mineAt(startTime + 1);
    await presale.connect(buyer).buyTokens({ value: purchaseValue });
    await mineAt(endTime + 1);
    await presale.finalize();
    await presale.connect(buyer).claimTokens();

    await presale.withdrawUnsoldTokens();

    assert.equal(await token.balanceOf(await presale.getAddress()), 0n);
  });

  it('refunds a failed sale and clears contribution and reserved-token accounting', async function () {
    const { startTime, endTime } = await deployPresale({
      softCap: ethers.parseEther('2'),
      hardCap: ethers.parseEther('5'),
    });
    const purchaseValue = ethers.parseEther('1');

    await mineAt(startTime + 1);
    await presale.connect(buyer).buyTokens({ value: purchaseValue });

    assert.equal(await presale.tokensReserved(), ethers.parseEther('1000'));

    await mineAt(endTime + 1);
    await presale.connect(buyer).claimRefund();

    assert.equal(await presale.contributions(buyer.address), 0n);
    assert.equal(await presale.tokensOwed(buyer.address), 0n);
    assert.equal(await presale.tokensReserved(), 0n);
    assert.equal(await ethers.provider.getBalance(await presale.getAddress()), 0n);
  });

  it('allows unsold-token recovery on failed sales while preserving unrefunded reserves', async function () {
    const { startTime, endTime, presaleAddress } = await deployPresale({
      softCap: ethers.parseEther('2'),
      hardCap: ethers.parseEther('5'),
    });

    await mineAt(startTime + 1);
    await presale.connect(buyer).buyTokens({ value: ethers.parseEther('1') });
    await mineAt(endTime + 1);

    await presale.withdrawUnsoldTokens();

    assert.equal(await token.balanceOf(presaleAddress), ethers.parseEther('1000'));
    assert.equal(await presale.tokensReserved(), ethers.parseEther('1000'));

    await presale.connect(buyer).claimRefund();
    await presale.withdrawUnsoldTokens();

    assert.equal(await token.balanceOf(presaleAddress), 0n);
    assert.equal(await presale.tokensReserved(), 0n);
  });

  it('does not let the owner withdraw raised funds before finalization', async function () {
    const startTime = Number(await presale.startTime());
    await mineAt(startTime + 1);
    await presale.connect(buyer).buyTokens({ value: ethers.parseEther('1') });

    await assert.rejects(
      () => presale.withdrawFunds(),
      /Presale not finalized/
    );
  });
});
