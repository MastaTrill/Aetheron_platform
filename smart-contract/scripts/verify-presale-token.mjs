import hre from 'hardhat';
import dotenv from 'dotenv';

dotenv.config({ path: "./.env", override: true });

async function main() {
    const { ethers } = hre;
    const conn = await hre.network.connect();
    const { ethers: connEthers } = conn;
    
    const presaleAddress = "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C";
    
    try {
        const provider = new connEthers.JsonRpcProvider('https://mainnet.base.org');
        
        const presaleAbi = [
            "function token() view returns (address)",
            "function softCap() view returns (uint256)",
            "function hardCap() view returns (uint256)"
        ];
        
        const presale = new connEthers.Contract(presaleAddress, presaleAbi, provider);
        
        console.log('\n=== Presale Contract Verification ===');
        console.log('Presale Address:', presaleAddress);
        
        const tokenAddress = await presale.token();
        console.log('Token Address in Contract:', tokenAddress);
        
        const softCap = await presale.softCap();
        console.log('Soft Cap:', connEthers.formatEther(softCap), 'ETH');
        
        const hardCap = await presale.hardCap();
        console.log('Hard Cap:', connEthers.formatEther(hardCap), 'ETH');
        
        const expectedToken = "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e";
        if (tokenAddress.toLowerCase() === expectedToken.toLowerCase()) {
            console.log('\n✅ Token address matches expected value');
        } else {
            console.log('\n⚠️ Token address mismatch!');
            console.log('Expected:', expectedToken);
            console.log('Actual:', tokenAddress);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main().then(() => process.exit(0));