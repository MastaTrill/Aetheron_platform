import fs from 'node:fs';
import assert from 'node:assert/strict';

const cname = fs.readFileSync(new URL('./CNAME', import.meta.url));

assert.equal(cname[0], 'a'.charCodeAt(0), 'CNAME must not include a BOM or UTF-16 prefix');
assert.equal(cname.includes(0), false, 'CNAME must not contain NUL bytes');
assert.equal(cname.toString('utf8'), 'aetrs.com\n', 'CNAME must contain exactly the canonical apex domain in UTF-8');

console.log('✅ GitHub Pages apex-domain configuration is canonical UTF-8 text');
