// Backend script: monitor tracked Base wallets and send OneSignal push notifications.
require('dotenv').config();
const { ethers } = require('ethers');

const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const ONESIGNAL_URL = process.env.ONESIGNAL_API_URL || 'https://onesignal.com/api/v1/notifications';
const WALLET_ADDRESSES = (process.env.WALLET_ADDRESSES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

let USER_MAP = {};
try {
  USER_MAP = JSON.parse(process.env.USER_MAP || '{}');
} catch {
  throw new Error('USER_MAP must be valid JSON');
}

if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
  throw new Error('OneSignal credentials are required');
}
if (WALLET_ADDRESSES.length === 0) {
  throw new Error('WALLET_ADDRESSES must contain at least one Base wallet');
}
for (const address of WALLET_ADDRESSES) {
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid wallet address: ${address}`);
  }
}

const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
const tracked = new Map(
  WALLET_ADDRESSES.map((address) => [
    address.toLowerCase(),
    USER_MAP[address.toLowerCase()] || USER_MAP[address] || '',
  ]),
);

async function sendPushNotification(playerId, title, message) {
  if (!playerId) return;

  const response = await fetch(ONESIGNAL_URL, {
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

async function notifyForTransaction(tx) {
  const from = tx.from?.toLowerCase();
  const to = tx.to?.toLowerCase();
  const amount = `${ethers.formatEther(tx.value)} ETH`;

  const deliveries = [];
  if (to && tracked.has(to)) {
    deliveries.push(
      sendPushNotification(tracked.get(to), 'Incoming Base Transaction', `You received ${amount}`),
    );
  }
  if (from && tracked.has(from)) {
    deliveries.push(
      sendPushNotification(tracked.get(from), 'Outgoing Base Transaction', `You sent ${amount}`),
    );
  }

  await Promise.allSettled(deliveries);
}

async function main() {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    throw new Error(`Wrong network: expected Base Mainnet ${BASE_CHAIN_ID}, got ${network.chainId}`);
  }

  console.log(`Monitoring ${tracked.size} wallet(s) on Base Mainnet.`);

  provider.on('block', async (blockNumber) => {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (!block) return;

      for (const tx of block.prefetchedTransactions) {
        const from = tx.from?.toLowerCase();
        const to = tx.to?.toLowerCase();
        if ((from && tracked.has(from)) || (to && tracked.has(to))) {
          await notifyForTransaction(tx);
        }
      }
    } catch (error) {
      console.error(`Base wallet monitor failed at block ${blockNumber}:`, error.message);
    }
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
