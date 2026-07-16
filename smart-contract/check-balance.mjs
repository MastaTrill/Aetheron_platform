import { ethers } from "ethers";

async function checkBalance() {
    const provider = new ethers.JsonRpcProvider('https://base.drpc.org');
    const address = '0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2';
    
    try {
        const balance = await provider.getBalance(address);
        console.log('Balance:', ethers.formatEther(balance), 'ETH');
        
        const blockNumber = await provider.getBlockNumber();
        console.log('Block number:', blockNumber);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkBalance();