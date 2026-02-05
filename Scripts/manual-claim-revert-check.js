// scripts/manual-claim-revert-check.js
// Run with: npx hardhat run scripts/manual-claim-revert-check.js --network localhost

async function main() {
  const [owner, user1] = await ethers.getSigners();
  const Aetheron = await ethers.getContractFactory("Aetheron");
  const aetheron = await Aetheron.deploy(owner.address, owner.address, owner.address);
  await aetheron.enableTrading();
  const AetheronStaking = await ethers.getContractFactory("AetheronStaking");
  const staking = await AetheronStaking.deploy(await aetheron.getAddress());
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const REWARD_AMOUNT = ethers.parseEther("100000");
  await aetheron.transfer(user1.address, INITIAL_SUPPLY);
  await aetheron.approve(await staking.getAddress(), REWARD_AMOUNT);
  await staking.depositRewards(REWARD_AMOUNT);
  await aetheron.setExcludedFromTax(user1.address, true);
  // User1 stakes
  const stakeAmount = ethers.parseEther("1000");
  await aetheron.connect(user1).approve(await staking.getAddress(), stakeAmount);
  await staking.connect(user1).stake(0, stakeAmount);
  // Try to claim rewards immediately (should revert)
  try {
    const tx = await staking.connect(user1).claimRewards(0);
    const receipt = await tx.wait();
    const parsedLogs = receipt.logs
      .map(log => {
        try {
          return staking.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(e => e);
    const debugReward = parsedLogs.find(e => e.name === "DebugReward");
    const debugTimestamps = parsedLogs.find(e => e.name === "DebugTimestamps");
    if (debugTimestamps) {
      console.log("DebugTimestamps event:", debugTimestamps.args);
    } else {
      console.log("No DebugTimestamps event found");
    }
    if (debugReward) {
      console.log("DebugReward event:", debugReward.args);
    } else {
      console.log("No DebugReward event found");
    }
    console.log("❌ claimRewards did NOT revert as expected");
  } catch (e) {
    if (e.message.includes("No rewards available")) {
      console.log("✅ claimRewards reverted with 'No rewards available' as expected");
    } else {
      console.log("⚠️ claimRewards reverted, but with a different error:", e.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
