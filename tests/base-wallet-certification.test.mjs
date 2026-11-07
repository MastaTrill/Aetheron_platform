import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const wallet = readFileSync(new URL('../dashboard-wallet.js', import.meta.url), 'utf8');
const portfolio = readFileSync(new URL('../portfolio-init.js', import.meta.url), 'utf8');

test('WalletConnect uses Base chain 8453', () => {
  assert.match(wallet, /optionalChains: \[8453\]/);
  assert.match(wallet, /eip155:8453/);
  assert.doesNotMatch(wallet, /optionalChains: \[137\]/);
});
test('legacy Polygon swap execution is blocked', () => {
  assert.match(wallet, /throw new Error\('Legacy Polygon swaps are disabled/);
});
test('wallet connection requests account access, not a signature', () => {
  const connect = wallet.split('async function connectMetaMask()')[1].split('async function connectWalletConnect')[0];
  assert.match(connect, /eth_requestAccounts/);
  assert.doesNotMatch(connect, /personal_sign|eth_sendTransaction|eth_signTypedData/);
});
test('portfolio requests Base network', () => {
  assert.match(portfolio, /chainId !== 8453/);
  assert.match(portfolio, /chainId: '0x2105'/);
  assert.doesNotMatch(portfolio, /chainId: '0x89'/);
});
