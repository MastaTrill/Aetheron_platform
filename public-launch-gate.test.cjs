const fs = require('fs');
function read(name) { return fs.readFileSync(name, 'utf8'); }
function assert(condition, message) { if (!condition) { console.error(`Launch-gate test failed: ${message}`); process.exit(1); } }
const canonical = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const legacy = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const index = read('index.html');
const indexJs = read('index.js');
const config = read('presale-config.js');
const readiness = read('presale-readiness.js');
const analyticsEntry = read('vercel-analytics.entry.mjs');
assert(index.includes(canonical), 'homepage must publish the canonical Base AETH address');
assert(indexJs.includes(canonical), 'homepage runtime must fall back to the canonical Base AETH address');
assert(!index.includes(legacy) && !indexJs.includes(legacy), 'legacy Polygon AETH address must not appear in public homepage runtime');
assert(!index.includes('Polygon Mainnet'), 'public homepage must not identify Polygon as production');
assert(index.includes('Base Mainnet (Chain ID: 8453)'), 'homepage Base instructions must publish chain ID 8453');
assert(!index.includes('Base Mainnet (Chain ID: 137)'), 'homepage must not label Polygon chain ID 137 as Base Mainnet');
assert(index.includes('https://rpc.ankr.com'), 'homepage CSP must allow the configured Ankr Base RPC fallback');
assert(!/Join the Presale|Join the Aetheron AETH presale/i.test(index), 'homepage metadata must not advertise an unauthorized presale');
assert(!/participate in the presale/i.test(index), 'homepage must not invite participation while authorization is pending');
assert(!index.includes('PRESALE_RATE') && !index.includes('presaleMaticInput'), 'homepage must not simulate an unauthorized purchase quote');
assert(!index.includes('Buy AETH Now') && !index.includes('Join the AETH Presale'), 'homepage must not advertise an unauthorized live sale');
assert(/launchAuthorized:\s*false/.test(config), 'presale config must default to launchAuthorized=false');
assert(/launchAuthorized:\s*false/.test(analyticsEntry), 'generated homepage config source must default to launchAuthorized=false');
assert(readiness.includes('config.launchAuthorized !== true'), 'presale readiness must fail closed unless final authorization is explicit');
console.log('Public launch-gate regression checks passed.');
