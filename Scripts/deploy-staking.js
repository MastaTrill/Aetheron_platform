// scripts/deploy-staking.js
import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("🚀 Deploying AetheronStaking contract...");

  // Replace with your deployed Aetheron token address
  const aetheronTokenAddress = process.env.AETHERON_TOKEN_ADDRESS || "<AETHERON_TOKEN_ADDRESS_HERE>";
  if (!ethers.isAddress(aetheronTokenAddress)) {
    throw new Error("Please set a valid AETHERON_TOKEN_ADDRESS in your environment or script.");
  }

  // Deploy staking contract
  const Staking = await ethers.getContractFactory("AetheronStaking");
  const staking = await Staking.deploy(aetheronTokenAddress);
  await staking.deployed();

  console.log(`✅ AetheronStaking deployed at: ${staking.address}`);

  // Attempt to auto-verify the contract
  try {
    console.log("\n🔍 Verifying contract on Polygonscan...");
    // Use child_process to run the verification command
    const { execSync } = await import('child_process');
    const network = process.env.HARDHAT_NETWORK || process.env.NETWORK || '<network>';
    if (network === '<network>') {
      console.log('⚠️  Set the HARDHAT_NETWORK or NETWORK environment variable to your target network.');
    } else {
      const verifyCmd = `npx hardhat verify --network ${network} ${staking.address} ${aetheronTokenAddress}`;
      console.log('Running:', verifyCmd);
      execSync(verifyCmd, { stdio: 'inherit' });
      console.log('✅ Contract verified!');
    }
  } catch (err) {
    console.error('❌ Verification failed:', err.message || err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
