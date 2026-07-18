import { ethers } from "ethers";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY =
  process.env.LOCAL_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Production-like economics with a short local-only start delay.
const RATE = 1_000_000n;
const SOFT_CAP = ethers.parseEther("5");
const HARD_CAP = ethers.parseEther("33.333333");
const MIN_CONTRIBUTION = ethers.parseEther("0.001");
const MAX_CONTRIBUTION = ethers.parseEther("1");
const START_DELAY = 60;
const DURATION = 14 * 24 * 60 * 60;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { batchMaxCount: 1 });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  if (network.chainId !== 31337n) {
    throw new Error(`Expected local chain 31337, received ${network.chainId}`);
  }

  console.log("Local deployer:", wallet.address);

  const mockArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/MockAETH.sol/MockAETH.json", "utf8")
  );
  const mockFactory = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, wallet);
  const mockToken = await mockFactory.deploy();
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();

  const presaleArtifact = JSON.parse(
    readFileSync(
      "./artifacts/contracts/AetheronPresale.sol/AetheronPresaleV2.json",
      "utf8"
    )
  );
  const presaleFactory = new ethers.ContractFactory(
    presaleArtifact.abi,
    presaleArtifact.bytecode,
    wallet
  );

  const latestBlock = await provider.getBlock("latest");
  if (!latestBlock) throw new Error("Unable to read the latest local block");
  const startTime = latestBlock.timestamp + START_DELAY;
  const endTime = startTime + DURATION;

  const presale = await presaleFactory.deploy(
    tokenAddress,
    RATE,
    SOFT_CAP,
    HARD_CAP,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION,
    startTime,
    endTime,
    wallet.address
  );
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();

  const fundingAmount = HARD_CAP * RATE;
  const fundTransaction = await mockToken.transfer(presaleAddress, fundingAmount);
  await fundTransaction.wait();

  const inventory = await mockToken.balanceOf(presaleAddress);
  if (inventory !== fundingAmount) {
    throw new Error("Local presale inventory does not match the exact hard-cap funding");
  }
  if ((await presale.token()).toLowerCase() !== tokenAddress.toLowerCase()) {
    throw new Error("Local presale token linkage is incorrect");
  }
  if ((await presale.treasury()).toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error("Local presale treasury linkage is incorrect");
  }

  mkdirSync("./deployments", { recursive: true });
  writeFileSync(
    "./deployments/presale-local.json",
    JSON.stringify(
      {
        network: "localhost",
        chainId: Number(network.chainId),
        presale: presaleAddress,
        token: tokenAddress,
        treasury: wallet.address,
        rate: RATE.toString(),
        softCapWei: SOFT_CAP.toString(),
        hardCapWei: HARD_CAP.toString(),
        minContributionWei: MIN_CONTRIBUTION.toString(),
        maxContributionWei: MAX_CONTRIBUTION.toString(),
        fundedTokenUnits: fundingAmount.toString(),
        startTime,
        endTime,
        deployedAt: new Date().toISOString()
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        network: "localhost",
        tokenAddress,
        presaleAddress,
        treasury: wallet.address,
        inventory: ethers.formatUnits(inventory, 18),
        note: "The public presale-config.js was not modified by this local-only deployment."
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Local presale deployment failed:", error);
  process.exit(1);
});
