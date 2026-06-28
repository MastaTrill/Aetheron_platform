import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");
const FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const LP_PAIR = "0xd57c5E33ebDC1b565F99d06809debbf86142705D";
const pairCreatedTopic = ethers.id("PairCreated(address,address,address,uint256)");

const currentBlock = await provider.getBlockNumber();
const chunkSize = 5000;

// Search from block 0 in chunks
for (let from = 0; from <= currentBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, currentBlock);
    try {
        const logs = await provider.getLogs({
            address: FACTORY,
            topics: [pairCreatedTopic],
            fromBlock: from,
            toBlock: to
        });
        for (const log of logs) {
            const pair = ethers.getAddress("0x" + log.topics[3].slice(26));
            if (pair.toLowerCase() === LP_PAIR.toLowerCase()) {
                console.log("Pair created in block:", log.blockNumber);
                const tx = await provider.getTransaction(log.transactionHash);
                console.log("Created by:", tx.from);
                process.exit(0);
            }
        }
    } catch (e) {
        // skip
    }
    if (from % 50000 === 0) console.log("Searched up to block", from);
}

console.log("Pair not found in factory events");
