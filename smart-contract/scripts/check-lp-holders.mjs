import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");
const LP_PAIR = "0xd57c5E33ebDC1b565F99d06809debbf86142705D";
const AETH = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";

// Check recent transfers in smaller chunks
const currentBlock = await provider.getBlockNumber();
const chunkSize = 5000;
const allLogs = [];

for (let from = currentBlock - 50000; from <= currentBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, currentBlock);
    try {
        const logs = await provider.getLogs({
            address: LP_PAIR,
            topics: [ethers.id("Transfer(address,address,uint256)")],
            fromBlock: from,
            toBlock: to
        });
        allLogs.push(...logs);
    } catch (e) {
        // skip chunks that fail
    }
}

console.log("Found", allLogs.length, "LP transfer events");

const balances = new Map();
allLogs.forEach(log => {
    const from = ethers.getAddress("0x" + log.topics[1].slice(26));
    const to = ethers.getAddress("0x" + log.topics[2].slice(26));
    const value = BigInt(log.data);
    if (from !== ethers.ZeroAddress) balances.set(from, (balances.get(from) || 0n) - value);
    if (to !== ethers.ZeroAddress) balances.set(to, (balances.get(to) || 0n) + value);
});

console.log("\nCurrent LP holders:");
for (const [addr, bal] of balances) {
    if (bal > 0n) console.log(" ", addr, "-", ethers.formatEther(bal), "LP");
}

// Also check: who created the pair? Look for the PairCreated event from the factory
const FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const pairCreatedTopic = ethers.id("PairCreated(address,address,address,uint256)");

// Search recent 50000 blocks for PairCreated with our pair
for (let from = currentBlock - 50000; from <= currentBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, currentBlock);
    try {
        const logs = await provider.getLogs({
            address: FACTORY,
            topics: [pairCreatedTopic],
            fromBlock: from,
            toBlock: to
        });
        logs.forEach(log => {
            const pair = ethers.getAddress("0x" + log.topics[3].slice(26));
            if (pair.toLowerCase() === LP_PAIR.toLowerCase()) {
                console.log("\nPair created in block:", log.blockNumber);
                // The transaction creator is the LP minter
                provider.getTransaction(log.transactionHash).then(tx => {
                    console.log("Created by:", tx.from);
                });
            }
        });
    } catch (e) {}
}
