import assert from 'node:assert/strict';
import fs from 'node:fs';

const contractPackage = JSON.parse(
  fs.readFileSync('smart-contract/package.json', 'utf8'),
);
const testScript = String(contractPackage?.scripts?.test || '');
const hardhatConfig = fs.readFileSync('smart-contract/hardhat.config.js', 'utf8');

assert.match(
  testScript,
  /npm run compile/,
  'smart-contract npm test must compile from a clean checkout before executing tests',
);
assert.equal(
  contractPackage?.devDependencies?.solc,
  '0.8.20',
  'smart-contract package must pin the compiler package used by Hardhat',
);
assert.match(
  hardhatConfig,
  /require\.resolve\(["']solc\/soljson\.js["']\)/,
  'Hardhat must resolve the pinned local compiler instead of requiring a network download',
);
assert.match(
  testScript,
  /--test-concurrency=1/,
  'smart-contract npm test must run Hardhat-heavy Node tests sequentially',
);

console.log('Smart-contract test runner is clean-checkout deterministic.');
