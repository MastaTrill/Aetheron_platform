const hre = require('hardhat');

async function main() {
  // Replace with your deployed contract address
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  // Replace with your Coinbase wallet address
  const coinbaseAddress = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';

  // Get signer
  const [deployer] = await hre.ethers.getSigners();

  // Get contract instance
  const token = await hre.ethers.getContractAt('Aetheron', contractAddress);

  // Get contract's token balance
  const contractBalance = await token.balanceOf(contractAddress);
  console.log(
    `Contract token balance: ${hre.ethers.utils.formatEther(
      contractBalance,
    )} AETH`,
  );

  if (contractBalance.isZero()) {
    console.log('No tokens to transfer.');
    return;
  }

  // Transfer all tokens to Coinbase wallet
  const tx = await token.transfer(coinbaseAddress, contractBalance);
  await tx.wait();
  console.log(
    `Transferred ${hre.ethers.utils.formatEther(
      contractBalance,
    )} AETH to ${coinbaseAddress}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
