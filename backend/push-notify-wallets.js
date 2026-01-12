// Backend script: Listen for wallet activity and send push notifications via OneSignal
// Requirements: ethers, axios, dotenv

require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

// --- CONFIG ---
const POLYGON_RPC = process.env.POLYGON_RPC_URL;
const WALLET_ADDRESSES = process.env.WALLET_ADDRESSES ? process.env.WALLET_ADDRESSES.split(',') : [];
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
// Map wallet address to OneSignal player/user ID
const USER_MAP = JSON.parse(process.env.USER_MAP || '{}');

const provider = new ethers.JsonRpcProvider(POLYGON_RPC);

async function sendPushNotification(playerId, title, message) {
  await axios.post('https://onesignal.com/api/v1/notifications', {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: [playerId],
    headings: { en: title },
    contents: { en: message },
  }, {
    headers: {
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

async function monitorWallet(address, playerId) {
  let lastBlock = await provider.getBlockNumber();
  const seenTxs = new Set();
  const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks
  
  provider.on('block', async (blockNumber) => {
    if (blockNumber <= lastBlock) return;
    
    // Check transactions in recent blocks
    for (let i = lastBlock + 1; i <= blockNumber; i++) {
      try {
        const block = await provider.getBlock(i, false); // Get block without full tx details
        if (!block || !block.transactions) continue;
        
        // Only fetch details for transactions that might be relevant
        // Note: ethers.js v6 doesn't provide transaction summaries, so we must fetch
        // full details to check sender/receiver. For production, consider using
        // event filters or indexed transaction APIs for better performance.
        for (const txHash of block.transactions) {
          const hash = typeof txHash === 'string' ? txHash : txHash.hash;
          if (seenTxs.has(hash)) continue;
          
          // Clean cache if it grows too large
          if (seenTxs.size >= MAX_CACHE_SIZE) {
            seenTxs.clear();
          }
          seenTxs.add(hash);
          
          const txDetails = await provider.getTransaction(hash);
          if (!txDetails) continue;
          
          // Only send notifications if this wallet is involved
          if (txDetails.to && txDetails.to.toLowerCase() === address.toLowerCase()) {
            await sendPushNotification(playerId, 'Incoming Transaction', `You received ${ethers.formatEther(txDetails.value)} MATIC`);
          } else if (txDetails.from && txDetails.from.toLowerCase() === address.toLowerCase()) {
            await sendPushNotification(playerId, 'Outgoing Transaction', `You sent ${ethers.formatEther(txDetails.value)} MATIC`);
          }
        }
      } catch (err) {
        console.error(`Error processing block ${i}:`, err.message);
      }
    }
    lastBlock = blockNumber;
  });
}

async function main() {
  for (const address of WALLET_ADDRESSES) {
    const playerId = USER_MAP[address.toLowerCase()];
    if (playerId) {
      monitorWallet(address, playerId);
      console.log(`Monitoring ${address} for push notifications.`);
    }
  }
}

main();
