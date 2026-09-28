import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const canonical = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const legacy = '0xab5ae0d8f569d7c2b27574319b864a5ba6f9671e';
const index = readFileSync('index.html', 'utf8');
const presale = readFileSync('presale.js', 'utf8');
const config = readFileSync('presale-config.js', 'utf8');

assert.match(index, /Canonical AETH Token/i, 'homepage must label the production token as canonical');
assert.match(index, new RegExp(canonical, 'i'), 'homepage must show the canonical Base token');
assert.match(index, /Chain ID:\s*8453/i, 'homepage must show Base chain ID 8453');
assert.match(index, /Verified on BaseScan/i, 'homepage must provide a verified explorer action');
assert.doesNotMatch(index, new RegExp(legacy, 'i'), 'homepage must not expose the legacy Polygon token address');
assert.doesNotMatch(presale, /POLYGON_NETWORK|Polygon Mainnet|0x89/, 'production presale code must be Base-only');
assert.match(config, new RegExp(canonical, 'i'), 'presale config must pin canonical AETH');
assert.match(config, /network:\s*["']base["']/i, 'presale config must pin Base');
assert.match(config, /chainId:\s*8453/, 'presale config must pin Base chain ID');
console.log('Canonical AETH production-surface checks passed.');
