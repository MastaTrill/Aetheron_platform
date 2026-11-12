import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const utilities = readFileSync(new URL('./shared-utils.js', import.meta.url), 'utf8');
assert.doesNotMatch(utilities, /Math\.random\(\)\s*\*\s*1000/, 'Never invent wallet balances');
assert.doesNotMatch(utilities, /0\.0001234|1234567|890123/, 'Never render unsupported AETH market quotes');
assert.match(utilities, /this\.priceData\s*=\s*null;/, 'Unverified prices must remain unavailable');
assert.match(utilities, /Number\.isFinite\(this\.userBalance\)/, 'Unknown wallet balance must display safely');
assert.match(utilities, /Number\.isFinite\(this\.userBalanceUSD\)/, 'Unknown USD balance must display safely');
console.log('Legacy shared UI exposes no invented wallet balances or AETH market prices');
