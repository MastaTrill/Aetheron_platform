import assert from 'node:assert/strict';
import fs from 'node:fs';

const contractPackage = JSON.parse(
  fs.readFileSync('smart-contract/package.json', 'utf8'),
);
const testScript = String(contractPackage?.scripts?.test || '');

assert.match(
  testScript,
  /npm run compile/,
  'smart-contract npm test must compile from a clean checkout before executing tests',
);
assert.match(
  testScript,
  /--test-concurrency=1/,
  'smart-contract npm test must run Hardhat-heavy Node tests sequentially',
);

console.log('Smart-contract test runner is clean-checkout deterministic.');