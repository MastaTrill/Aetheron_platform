import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('./dashboard-metamask-connect.entry.mjs', import.meta.url), 'utf8');
assert.match(source, /const BASE_SCOPE = 'eip155:8453'/);
assert.match(source, /const BASE_CHAIN_ID = '0x2105'/);
assert.match(source, /const BASE_RPC_URL = 'https:\/\/mainnet\.base\.org'/);
assert.match(source, /\[BASE_SCOPE\]: BASE_RPC_URL/);
assert.doesNotMatch(source, /POLYGON_SCOPE|POLYGON_CHAIN_ID|POLYGON_RPC_URL|eip155:137|polygon-rpc\.com|Polygon Mainnet/i);
console.log('Base MetaMask multichain source safety checks passed');
