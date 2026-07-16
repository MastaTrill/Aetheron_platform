import { ethers } from "ethers";

async function estimateGas() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const address = '0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2';
    
    try {
        const feeData = await provider.getFeeData();
        console.log('Gas Price (Gwei):', ethers.formatUnits(feeData.gasPrice, 'gwei'));
        
        const estimatedGas = 2500000n;
        const cost = estimatedGas * feeData.gasPrice;
        console.log('\nEstimated deployment cost:', ethers.formatEther(cost), 'ETH');
        
        const balance = await provider.getBalance(address);
        const balanceInEther = ethers.formatEther(balance);
        console.log('Account balance:', balanceInEther, 'ETH');
        
        if (parseFloat(balanceInEther) > parseFloat(ethers.formatEther(cost)) * 1.5) {
            console.log('✅ Sufficient balance for deployment');
        } else {
            console.log('⚠️ May need more ETH for gas');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

estimateGas();