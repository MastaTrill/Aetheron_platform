// Backend script: Listen for wallet activity and send push notifications via OneSignal
// Requirements: ethers, axios, dotenv

require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

// --- CONFIG ---
const POLYGON_RPC = process.env.POLYGON_RPC_URL;
const WALLET_ADDRESSES = process.env.WALLET_ADDRESSES
  ? process.env.WALLET_ADDRESSES.split(',')
  : [];
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
// Map wallet address to OneSignal player/user ID
const USER_MAP = JSON.parse(process.env.USER_MAP || '{}');

const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);

async function sendPushNotification(playerId, title, message) {
  await axios.post(
    'https://onesignal.com/api/v1/notifications',
    {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
    },
    {
      headers: {
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );
}

async function monitorWallet(address, playerId) {
  let lastBlock = await provider.getBlockNumber();
  provider.on('block', async (blockNumber) => {
    if (blockNumber <= lastBlock) return;
    lastBlock = blockNumber;
    const txs = await provider.getHistory(
      address,
      blockNumber - 5,
      blockNumber,
    );
    for (const tx of txs) {
      if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
        await sendPushNotification(
          playerId,
          'Incoming Transaction',
          `You received ${ethers.utils.formatEther(tx.value)} MATIC`,
        );
      }
      if (tx.from && tx.from.toLowerCase() === address.toLowerCase()) {
        await sendPushNotification(
          playerId,
          'Outgoing Transaction',
          `You sent ${ethers.utils.formatEther(tx.value)} MATIC`,
        );
      }
    }
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
[new_code];
