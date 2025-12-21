// Aetheron Contract Addresses - Polygon Mainnet
export const CONTRACTS = {
  NETWORK: {
    CHAIN_ID: 137,
    NAME: 'Polygon',
    RPC_URL: 'https://polygon-rpc.com',
    EXPLORER: 'https://polygonscan.com',
  },
  AETH_TOKEN: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
  STAKING: '0x896D9d37A67B0bBf81dde0005975DA7850FFa638',
  LIQUIDITY_PAIR: '0xd57c5E33ebDC1b565F99d06809debbf86142705D',
  QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
};

export const WALLETCONNECT_PROJECT_ID = '092d7603-5e43-460e-b0c0-a32e78ffbf30'; // Set from https://dashboard.walletconnect.com

export const TOKEN_INFO = {
  name: 'Aetheron',
  symbol: 'AETH',
  decimals: 18,
  totalSupply: '1000000000',
  logo: require('../assets/logo.png'),
};

export const LINKS = {
  WEBSITE: 'https://mastatrill.github.io/aetheron-platform',
  BUY_QUICKSWAP: `https://quickswap.exchange/#/swap?outputCurrency=${CONTRACTS.AETH_TOKEN}`,
  DEXTOOLS: `https://www.dextools.io/app/polygon/pair-explorer/${CONTRACTS.LIQUIDITY_PAIR}`,
  DEXSCREENER: `https://dexscreener.com/polygon/${CONTRACTS.AETH_TOKEN}`,
  POLYGONSCAN_TOKEN: `${CONTRACTS.NETWORK.EXPLORER}/token/${CONTRACTS.AETH_TOKEN}`,
  POLYGONSCAN_STAKING: `${CONTRACTS.NETWORK.EXPLORER}/address/${CONTRACTS.STAKING}`,
};
