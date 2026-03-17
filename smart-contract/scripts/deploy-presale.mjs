import hre from "hardhat";

async function main() {
    console.log("Deploying AetheronPresale...");

    // 1. Get the AETH Token Address (from your existing deployment)
    // Replace this with your actual AETH token address if different
    const AETH_TOKEN_ADDRESS = "0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82";

    // 2. Set the Rate
    // 1 MATIC = 1000 AETH (Example rate, fully adjustable)
    // If MATIC is $0.50, then 1000 AETH = $0.50 -> 1 AETH = $0.0005
    const RATE = 1000;

    // 3. Presale Caps
    // Max tokens: 40,000,000 AETH
    // Max raise: $25,000 at $0.75/MATIC => 33,333.333... MATIC
    const MAX_TOKENS_FOR_SALE = hre.ethers.parseEther("40000000");
    const MAX_WEI_RAISED = hre.ethers.parseEther("33333.333333333333333333");

    // 4. Deploy
    const AetheronPresale = await hre.ethers.getContractFactory("AetheronPresale");
    const presale = await AetheronPresale.deploy(AETH_TOKEN_ADDRESS, RATE, MAX_TOKENS_FOR_SALE, MAX_WEI_RAISED);

    await presale.waitForDeployment();
    const address = await presale.getAddress();

    console.log("------------------------------------------");
    console.log("✅ Presale Deployed to:", address);
    console.log("------------------------------------------");

    // 5. Exclude Presale from Tax
    console.log("⚙️  Excluding Presale Contract from Tax...");
    try {
        const token = await hre.ethers.getContractAt("Aetheron", AETH_TOKEN_ADDRESS);
        const tx = await token.setExcludedFromTax(address, true);
        await tx.wait();
        console.log("✅ Presale contract excluded from tax restrictions.");
    } catch (error) {
        console.error("⚠️  Failed to exclude presale from tax. Ensure you are the owner of the AETH token contract.");
        console.error("   Error:", error.message);
    }

    console.log("------------------------------------------");
    console.log("Next Steps:");
    console.log("1. Send AETH tokens to this contract address to fund the sale.");
    console.log(`   Transfer amount: up to 40,000,000 AETH to ${address}`);
    console.log("2. Update 'presale.js' with the new contract address.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
