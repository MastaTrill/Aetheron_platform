import hre from 'hardhat';
import fs from 'fs';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config({ path: "./.env", override: true });

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('Deploying New Presale with Correct Token');
    console.log('='.repeat(60) + '\n');

    const { ethers: hreEthers } = await hre.network.connect();
    const tokenAddress = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";
    const rate = ethers.parseEther("1000");
    const softCap = ethers.parseEther("5000");
    const hardCap = ethers.parseEther("33333.333333333333333333");
    const minContribution = ethers.parseEther("0.001");
    const maxContribution = ethers.parseEther("100");
    
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60;
    const endTime = now + 86400 * 7;
    const treasury = "0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784";

    console.log('\n📜 Deploying AetheronPresaleV2...');
    const Presale = await hreEthers.getContractFactory('contracts/AetheronPresale.sol:AetheronPresaleV2');
    const presale = await Presale.deploy(
        tokenAddress,
        rate,
        softCap,
        hardCap,
        minContribution,
        maxContribution,
        startTime,
        endTime,
        treasury
    );
    await presale.waitForDeployment();
    const presaleAddress = await presale.getAddress();
    console.log('✅ Presale deployed to:', presaleAddress);

    console.log('\n📦 Funding presale with 50M AETH...');
    const amount = ethers.parseEther("50000000");
    const token = await hreEthers.getContractAt('contracts/Aetheron.sol:Aetheron', tokenAddress);
    await token.transfer(presaleAddress, amount);
    console.log('✅ Presale funded with 50M AETH tokens');

    fs.writeFileSync('deployments/presale-base-new.json', JSON.stringify({
        network: "base",
        token: tokenAddress,
        presale: presaleAddress,
        treasury: treasury,
        rate: rate.toString(),
        softCap: softCap.toString(),
        hardCap: hardCap.toString(),
        startTime: startTime,
        endTime: endTime,
        timestamp: new Date().toISOString()
    }, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ New Presale Deployed!');
    console.log('Token:', tokenAddress);
    console.log('Presale:', presaleAddress);
    console.log('='.repeat(60));
}

main().catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
});