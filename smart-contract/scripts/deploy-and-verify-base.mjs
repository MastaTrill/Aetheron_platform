import hre from 'hardhat';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: "./.env", override: true });

const NEW_OWNER = process.env.NEW_OWNER_ADDRESS;
const TEAM_WALLET = process.env.TEAM_WALLET;
const MARKETING_WALLET = process.env.MARKETING_WALLET;
const STAKING_POOL = process.env.STAKING_POOL;
const PRESALE_ADDRESS = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";

async function main() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 Aetheron Base Deployment + Verification');
    console.log('='.repeat(80) + '\n');

    const [deployer] = await hre.ethers.getSigners();
    console.log('Deployer:', deployer.address);

    // Deploy Token
    console.log('\n📜 Deploying Aetheron Token...');
    const Aetheron = await hre.ethers.getContractFactory('Aetheron');
    const aetheron = await Aetheron.deploy(TEAM_WALLET, MARKETING_WALLET, STAKING_POOL);
    await aetheron.waitForDeployment();
    const tokenAddress = await aetheron.getAddress();
    console.log('✅ Token deployed to:', tokenAddress);

    // Exclude Presale from Tax
    console.log('\n⚙️ Excluding presale from tax...');
    await (await aetheron.setExcludedFromTax(PRESALE_ADDRESS, true)).wait();
    console.log('✅ Presale excluded');

    // Fund Presale
    console.log('\n📦 Funding presale with 50M AETH...');
    const amount = hre.ethers.parseEther("50000000");
    await (await aetheron.transfer(PRESALE_ADDRESS, amount)).wait();
    console.log('✅ Presale funded');

    // Update Frontend Config
    const config = `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${tokenAddress}",
  presaleContractAddress: "${PRESALE_ADDRESS}",
  maxPresaleTokens: 33333333,
  network: "base",
  chainId: 8453,
  nativeSymbol: "ETH",
  minContribution: 0.001,
  maxContribution: 100
};
`;
    fs.writeFileSync('../presale-config.js', config);
    console.log('✅ presale-config.js updated');

    // Save Deployment Info
    fs.mkdirSync('./deployments', { recursive: true });
    fs.writeFileSync('./deployments/presale-base.json', JSON.stringify({
        network: "base",
        token: tokenAddress,
        presale: PRESALE_ADDRESS,
        owner: NEW_OWNER,
        timestamp: new Date().toISOString()
    }, null, 2));

    // Automatic Verification
    console.log('\n🔍 Verifying contracts on Basescan...');
    try {
        await hre.run("verify:verify", {
            address: tokenAddress,
            constructorArguments: [TEAM_WALLET, MARKETING_WALLET, STAKING_POOL],
            network: "base"
        });
        console.log('✅ Token verified');
    } catch (e) {
        console.log('⚠️ Token verification failed (may already be verified):', e.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('Token Address:', tokenAddress);
    console.log('Presale Address:', PRESALE_ADDRESS);
    console.log('Config updated → presale-config.js');
    console.log('='.repeat(80));
}

main().catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
});