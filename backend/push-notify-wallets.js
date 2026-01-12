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
  
  provider.on('block', async (blockNumber) => {
    if (blockNumber <= lastBlock) return;
    
    // Check transactions in recent blocks
    for (let i = lastBlock + 1; i <= blockNumber; i++) {
      try {
        const block = await provider.getBlock(i, true);
        if (!block || !block.transactions) continue;
        
        for (const tx of block.transactions) {
          const txHash = typeof tx === 'string' ? tx : tx.hash;
          if (seenTxs.has(txHash)) continue;
          seenTxs.add(txHash);
          
          const txDetails = typeof tx === 'string' ? await provider.getTransaction(tx) : tx;
          if (!txDetails) continue;
          
          if (txDetails.to && txDetails.to.toLowerCase() === address.toLowerCase()) {
            await sendPushNotification(playerId, 'Incoming Transaction', `You received ${ethers.formatEther(txDetails.value)} MATIC`);
          }
          if (txDetails.from && txDetails.from.toLowerCase() === address.toLowerCase()) {
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
