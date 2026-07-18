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
  tokensPerEth: 1000000
});
window.POLYGON_RPC_URLS = [...window.AETHERON_PRESALE_CONFIG.rpcUrls];

"use strict";(()=>{var p=()=>{window.va||(window.va=function(...r){window.vaq||(window.vaq=[]),window.vaq.push(r)})},w="@vercel/analytics",m="2.0.1";function d(){return typeof window<"u"}function u(){try{let e="production";if(e==="development"||e==="test")return"development"}catch{}return"production"}function y(e="auto"){if(e==="auto"){window.vam=u();return}window.vam=e}function b(){return(d()?window.vam:u())||"production"}function c(){return b()==="development"}function h(e){return e.scriptSrc?o(e.scriptSrc):c()?"https://va.vercel-scripts.com/v1/script.debug.js":e.basePath?o(`${e.basePath}/insights/script.js`):"/_vercel/insights/script.js"}function g(e,r){var i;let n=e;if(r)try{n={...(i=JSON.parse(r))==null?void 0:i.analytics,...e}}catch{}y(n.mode);let t={sdkn:w+(n.framework?`/${n.framework}`:""),sdkv:m};return n.disableAutoTrack&&(t.disableAutoTrack="1"),n.viewEndpoint&&(t.viewEndpoint=o(n.viewEndpoint)),n.eventEndpoint&&(t.eventEndpoint=o(n.eventEndpoint)),n.sessionEndpoint&&(t.sessionEndpoint=o(n.sessionEndpoint)),c()&&n.debug===!1&&(t.debug="false"),n.dsn&&(t.dsn=n.dsn),n.endpoint?t.endpoint=n.endpoint:n.basePath&&(t.endpoint=o(`${n.basePath}/insights`)),{beforeSend:n.beforeSend,src:h(n),dataset:t}}function o(e){return e.startsWith("http://")||e.startsWith("https://")||e.startsWith("/")?e:`/${e}`}function l(e={debug:!0},r){var i;if(!d())return;let{beforeSend:n,src:t,dataset:f}=g(e,r);if(p(),n&&((i=window.va)==null||i.call(window,"beforeSend",n)),document.head.querySelector(`script[src*="${t}"]`))return;let s=document.createElement("script");s.src=t;for(let[a,v]of Object.entries(f))s.dataset[a]=v;s.defer=!0,s.onerror=()=>{let a=c()?"Please check if any ad blockers are enabled and try again.":"Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.";console.log(`[Vercel Web Analytics] Failed to load script from ${t}. ${a}`)},document.head.appendChild(s)}typeof window<"u"&&(l(),console.log("Vercel Analytics initialized"));})();
