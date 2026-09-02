/**
 * Vercel Web Analytics Entry Point
 * Publishes the canonical Base runtime configuration before the app boots.
 */
import { inject } from '@vercel/analytics';

if (typeof window !== 'undefined') {
  window.AETHERON_PRESALE_CONFIG = Object.freeze({
    chainId: 8453,
    chainIdHex: '0x2105',
    chainName: 'Base Mainnet',
    nativeCurrency: Object.freeze({ name: 'Ether', symbol: 'ETH', decimals: 18 }),
    rpcUrls: Object.freeze(['https://mainnet.base.org', 'https://base.drpc.org', 'https://rpc.ankr.com/base']),
    blockExplorerUrls: Object.freeze(['https://basescan.org']),
    tokenAddress: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
    presaleAddress: '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d',
    minimumPurchaseEth: '0.0003',
    tokensPerEth: 1000000,
    launchAuthorized: false,
    launchStatus: 'pending-final-authorization'
  });
  window.BASE_RPC_URLS = [...window.AETHERON_PRESALE_CONFIG.rpcUrls];
  window.POLYGON_RPC_URLS = window.BASE_RPC_URLS;
  inject();
  console.log('Vercel Analytics initialized');
}
