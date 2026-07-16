import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deployment = JSON.parse(
  await fs.readFile(path.resolve(__dirname, "../deployments/presale-base.json"), "utf8")
);

const TOKEN_ADDRESS = deployment.contracts.Aetheron.address;
const PRESALE_ADDRESS = deployment.contracts.Presale.address;

const PRESALE_ABI = [
  "function token() view returns (address)",
  "function rate() view returns (uint256)",
  "function weiRaised() view returns (uint256)",
  "function tokensReserved() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function maxContribution() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function finalized() view returns (bool)",
  "function cancelled() view returns (bool)",
  "function contributions(address) view returns (uint256)",
  "function buyTokens() payable"
];

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)"
];

describe("Base mainnet fork", { concurrency: false }, function () {
  it("reads deployed state and simulates a purchase when current state permits", async function () {
    const { ethers } = await network.connect("baseFork");
    const [buyer] = await ethers.getSigners();

    const [tokenCode, presaleCode] = await Promise.all([
      ethers.provider.getCode(TOKEN_ADDRESS),
      ethers.provider.getCode(PRESALE_ADDRESS)
    ]);
    assert.notEqual(tokenCode, "0x", "AETH token bytecode is missing on the Base fork");
    assert.notEqual(presaleCode, "0x", "Presale bytecode is missing on the Base fork");

    const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, buyer);
    const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, ethers.provider);

    const [
      linkedToken,
      rate,
      raisedBefore,
      reserved,
      hardCap,
      minContribution,
      maxContribution,
      startTime,
      endTime,
      finalized,
      cancelled,
      inventory,
      latestBlock
    ] = await Promise.all([
      presale.token(),
      presale.rate(),
      presale.weiRaised(),
      presale.tokensReserved(),
      presale.hardCap(),
      presale.minContribution(),
      presale.maxContribution(),
      presale.startTime(),
      presale.endTime(),
      presale.finalized(),
      presale.cancelled(),
      token.balanceOf(PRESALE_ADDRESS),
      ethers.provider.getBlock("latest")
    ]);

    assert.equal(linkedToken.toLowerCase(), TOKEN_ADDRESS.toLowerCase());
    assert.ok(inventory >= reserved, "Presale inventory is below reserved liabilities");
    assert.ok(minContribution > 0n && minContribution <= maxContribution);
    assert.ok(raisedBefore <= hardCap);
    assert.ok(latestBlock);

    const now = BigInt(latestBlock.timestamp);
    const remainingCapacity = hardCap - raisedBefore;
    const tokensForMinimum = minContribution * rate;
    const availableInventory = inventory - reserved;
    const canPurchase =
      now >= startTime &&
      now <= endTime &&
      !finalized &&
      !cancelled &&
      remainingCapacity >= minContribution &&
      availableInventory >= tokensForMinimum;

    if (!canPurchase) {
      console.log("Fork purchase skipped because current mainnet state does not permit a minimum contribution", {
        now: now.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        finalized,
        cancelled,
        remainingCapacity: remainingCapacity.toString(),
        availableInventory: availableInventory.toString(),
        tokensForMinimum: tokensForMinimum.toString()
      });
      return;
    }

    const buyerAddress = await buyer.getAddress();
    const contributionBefore = await presale.contributions(buyerAddress);
    await presale.buyTokens.staticCall({ value: minContribution });
    const tx = await presale.buyTokens({ value: minContribution });
    await tx.wait();

    assert.equal(await presale.weiRaised(), raisedBefore + minContribution);
    assert.equal(await presale.contributions(buyerAddress), contributionBefore + minContribution);
  });
});
