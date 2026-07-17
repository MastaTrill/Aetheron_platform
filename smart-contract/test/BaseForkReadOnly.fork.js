import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";
import {
  callViewWithRetry,
  providerReadWithRetry,
  readWithRetry
} from "../scripts/lib/base-read-retry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deployment = JSON.parse(
  await fs.readFile(path.resolve(__dirname, "../deployments/presale-base.json"), "utf8")
);

const TOKEN_ADDRESS = deployment.contracts.Aetheron.address;
const ACTIVE_PRESALE_ADDRESS = deployment.contracts.Presale?.address;
const INVALID_PRESALE_ADDRESS = deployment.contracts.InvalidPresale?.address;

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
  it("proves the configured deployment state without spending real ETH", async function () {
    const connection = await readWithRetry(
      () => network.connect("baseFork"),
      "Base fork connection",
      { validate: (value) => Boolean(value?.ethers) }
    );
    const { ethers } = connection;
    const [buyer] = await ethers.getSigners();

    const tokenCode = await providerReadWithRetry(
      ethers.provider,
      "getCode",
      [TOKEN_ADDRESS],
      "Forked AETH bytecode",
      { validate: (value) => typeof value === "string" && value !== "0x" }
    );
    assert.notEqual(tokenCode, "0x", "AETH token bytecode is missing on the Base fork");
    const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, ethers.provider);

    if (!ACTIVE_PRESALE_ADDRESS) {
      assert.ok(INVALID_PRESALE_ADDRESS, "No active or invalid presale address is recorded");
      const invalidCode = await providerReadWithRetry(
        ethers.provider,
        "getCode",
        [INVALID_PRESALE_ADDRESS],
        "Forked invalid presale bytecode",
        { validate: (value) => typeof value === "string" && value !== "0x" }
      );
      assert.notEqual(invalidCode, "0x", "Recorded invalid presale bytecode is missing");

      const invalidPresale = new ethers.Contract(INVALID_PRESALE_ADDRESS, PRESALE_ABI, ethers.provider);
      const linkedToken = await callViewWithRetry(
        invalidPresale,
        "token",
        [],
        "Forked invalid presale token()"
      );
      const expectedTokenBalance = await callViewWithRetry(
        token,
        "balanceOf",
        [INVALID_PRESALE_ADDRESS],
        "Forked locked AETH balance"
      );
      const weiRaised = await callViewWithRetry(
        invalidPresale,
        "weiRaised",
        [],
        "Forked invalid presale weiRaised()"
      );
      const cancelled = await callViewWithRetry(
        invalidPresale,
        "cancelled",
        [],
        "Forked invalid presale cancelled()"
      );
      const finalized = await callViewWithRetry(
        invalidPresale,
        "finalized",
        [],
        "Forked invalid presale finalized()"
      );

      assert.notEqual(
        linkedToken.toLowerCase(),
        TOKEN_ADDRESS.toLowerCase(),
        "Deployment record says invalid, but token linkage now matches"
      );
      assert.equal(deployment.launchable, false, "Mismatched deployment must remain non-launchable");
      console.log("Invalid Base presale safely detected on fork", {
        invalidPresale: INVALID_PRESALE_ADDRESS,
        expectedToken: TOKEN_ADDRESS,
        linkedToken,
        expectedTokenBalance: expectedTokenBalance.toString(),
        weiRaised: weiRaised.toString(),
        cancelled,
        finalized
      });
      return;
    }

    const presaleCode = await providerReadWithRetry(
      ethers.provider,
      "getCode",
      [ACTIVE_PRESALE_ADDRESS],
      "Forked replacement presale bytecode",
      { validate: (value) => typeof value === "string" && value !== "0x" }
    );
    assert.notEqual(presaleCode, "0x", "Presale bytecode is missing on the Base fork");

    const presale = new ethers.Contract(ACTIVE_PRESALE_ADDRESS, PRESALE_ABI, buyer);
    const linkedToken = await callViewWithRetry(presale, "token", [], "Forked replacement token()");
    const rate = await callViewWithRetry(presale, "rate", [], "Forked replacement rate()");
    const raisedBefore = await callViewWithRetry(
      presale,
      "weiRaised",
      [],
      "Forked replacement weiRaised()"
    );
    const reserved = await callViewWithRetry(
      presale,
      "tokensReserved",
      [],
      "Forked replacement tokensReserved()"
    );
    const hardCap = await callViewWithRetry(presale, "hardCap", [], "Forked replacement hardCap()");
    const minContribution = await callViewWithRetry(
      presale,
      "minContribution",
      [],
      "Forked replacement minContribution()"
    );
    const maxContribution = await callViewWithRetry(
      presale,
      "maxContribution",
      [],
      "Forked replacement maxContribution()"
    );
    const startTime = await callViewWithRetry(
      presale,
      "startTime",
      [],
      "Forked replacement startTime()"
    );
    const endTime = await callViewWithRetry(presale, "endTime", [], "Forked replacement endTime()");
    const finalized = await callViewWithRetry(
      presale,
      "finalized",
      [],
      "Forked replacement finalized()"
    );
    const cancelled = await callViewWithRetry(
      presale,
      "cancelled",
      [],
      "Forked replacement cancelled()"
    );
    const inventory = await callViewWithRetry(
      token,
      "balanceOf",
      [ACTIVE_PRESALE_ADDRESS],
      "Forked replacement AETH inventory"
    );
    const latestBlock = await providerReadWithRetry(
      ethers.provider,
      "getBlock",
      ["latest"],
      "Forked latest block",
      { validate: Boolean }
    );

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
      console.log("Fork purchase skipped because current active state does not permit a minimum contribution", {
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
    const contributionBefore = await callViewWithRetry(
      presale,
      "contributions",
      [buyerAddress],
      "Forked buyer contribution"
    );
    await readWithRetry(
      () => presale.buyTokens.staticCall({ value: minContribution }),
      "Forked purchase static call",
      { validate: (value) => value !== undefined }
    );
    const tx = await presale.buyTokens({ value: minContribution });
    await tx.wait();

    const raisedAfter = await callViewWithRetry(
      presale,
      "weiRaised",
      [],
      "Forked post-purchase weiRaised()"
    );
    const contributionAfter = await callViewWithRetry(
      presale,
      "contributions",
      [buyerAddress],
      "Forked post-purchase contribution"
    );
    assert.equal(raisedAfter, raisedBefore + minContribution);
    assert.equal(contributionAfter, contributionBefore + minContribution);
  });
});
