import hre from 'hardhat';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: "./smart-contract/.env", override: true });

const NEW_OWNER = process.env.NEW_OWNER_ADDRESS;
const TEAM_WALLET = process.env.TEAM_WALLET;
const MARKETING_WALLET = process.env.MARKETING_WALLET;
const STAKING_POOL = process.env.STAKING_POOL;

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('Deploying Aetheron Token to Base Mainnet');
    console.log('='.repeat(60) + '\n');

    if (!NEW_OWNER || NEW_OWNER === '0x0000000000000000000000000000000000000000') {
        console.error('NEW_OWNER_ADDRESS must be set in .env');
        process.exit(1);
    }
    if (!TEAM_WALLET || !MARKETING_WALLET || !STAKING_POOL) {
        console.error('TEAM_WALLET, MARKETING_WALLET, and STAKING_POOL are required in .env');
        process.exit(1);
    }

    const connection = await hre.network.connect();
    const { ethers } = connection;
    const [deployer] = await ethers.getSigners();

    console.log('Deployer:', deployer.address);
    console.log('New Owner:', NEW_OWNER);

    if (deployer.address.toLowerCase() !== NEW_OWNER.toLowerCase()) {
        console.error('Deployer wallet does not match NEW_OWNER_ADDRESS.');
        process.exit(1);
    }

    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceInEther = ethers.formatEther(balance);
    console.log('Balance:', balanceInEther, 'ETH');

    if (parseFloat(balanceInEther) < 0.01) {
        console.error('Insufficient balance for deployment');
        process.exit(1);
    }

    console.log('\nDeploying Aetheron Token...');
    const Aetheron = await ethers.getContractFactory('contracts/Aetheron.sol:Aetheron');
    const aetheron = await Aetheron.deploy(TEAM_WALLET, MARKETING_WALLET, STAKING_POOL);
    await aetheron.waitForDeployment();
    const tokenAddress = await aetheron.getAddress();
    console.log('✅ Aetheron Token deployed to:', tokenAddress);

    console.log('\nExcluding presale from tax...');
    const presaleAddress = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
    const excludeTx = await aetheron.setExcludedFromTax(presaleAddress, true);
    await excludeTx.wait();
    console.log('✅ Presale excluded from tax');

    console.log('\nUpdating presale-config.js...');
    const frontendConfig = `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${tokenAddress}",
  presaleContractAddress: "${presaleAddress}",
  maxPresaleTokens: 33333333
};
`;
    fs.writeFileSync('presale-config.js', frontendConfig);
    console.log('✅ presale-config.js updated');

    const deploymentInfo = {
        network: "base",
        timestamp: new Date().toISOString(),
        contracts: {
            Aetheron: { address: tokenAddress },
            Presale: { address: presaleAddress }
        }
    };
    fs.writeFileSync('deployments/presale-base.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('✅ Deployment info saved to deployments/presale-base.json');

    console.log('\n' + '='.repeat(60));
    console.log('Token Address:', tokenAddress);
    console.log('Presale Address:', presaleAddress);
    console.log('=' .repeat(60) + '\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });