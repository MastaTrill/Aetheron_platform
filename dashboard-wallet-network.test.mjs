import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./dashboard-metamask-connect.entry.mjs', import.meta.url), 'utf8');

test('wallet bridge uses canonical Base Mainnet, not legacy Polygon', () => {
  assert.match(source, /const BASE_SCOPE = 'eip155:8453'/);
  assert.match(source, /const BASE_CHAIN_ID = '0x2105'/);
  assert.match(source, /const BASE_RPC_URL = 'https:\/\/mainnet\.base\.org\/'/);
  assert.doesNotMatch(source, /eip155:137|polygon-rpc\.com|Polygon Mainnet/);
});

test('wallet bridge rejects unsupported chain requests and clears disconnected accounts', () => {
  assert.match(source, /case 'wallet_switchEthereumChain'/);
  assert.match(source, /case 'wallet_addEthereumChain'/);
  assert.match(source, /error\.code = 4902/);
  assert.match(source, /provider\.syncAccounts\(\[\]\)/);
  assert.match(source, /provider\.emit\('accountsChanged', \[\]\)/);
});
