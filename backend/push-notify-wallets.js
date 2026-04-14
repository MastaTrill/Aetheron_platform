// Backend script: Listen for wallet activity and send push notifications via OneSignal
// Requirements: ethers, dotenv

require('dotenv').config();
const { ethers } = require('ethers');

const POLYGON_RPC = process.env.POLYGON_RPC_URL;
const WALLET_ADDRESSES = process.env.WALLET_ADDRESSES
  ? process.env.WALLET_ADDRESSES.split(',').map((value) => value.trim()).filter(Boolean)
  : [];
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const USER_MAP = JSON.parse(process.env.USER_MAP || '{}');

if (!POLYGON_RPC) {
  throw new Error('POLYGON_RPC_URL is required');
}

if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
  throw new Error('OneSignal credentials are required');
}

const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);

async function sendPushNotification(playerId, title, message) {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OneSignal request failed: ${response.status} ${body}`);
  }
}

async function monitorWallet(address, playerId) {
  let lastBlock = await provider.getBlockNumber();
  provider.on('block', async (blockNumber) => {
    if (blockNumber <= lastBlock) return;
    lastBlock = blockNumber;

    try {
      const txs = await provider.getHistory(address, blockNumber - 5, blockNumber);
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
    } catch (error) {
      console.error(`Wallet monitor failed for ${address}:`, error.message);
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

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
