import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const pkg = JSON.parse(read('smart-contract/package.json'));
const scripts = JSON.stringify(pkg.scripts || {});

assert.doesNotMatch(scripts, /deploy:treasury|deploy-treasury|deploy-upgradeable|verify-upgradeable|AetheronMultiSigTreasury|AetheronGovernance|AetheronVendor/i,
  'non-production governance/treasury/vendor contracts must not have active npm deployment entrypoints');

for (const p of [
  'smart-contract/scripts/deploy-treasury.js',
  'smart-contract/scripts/deploy-upgradeable.cjs',
  'smart-contract/scripts/deploy-upgradeable.js',
  'smart-contract/scripts/verify-upgradeable.js',
]) {
  assert.equal(exists(p), false, `${p} must be removed from the active scripts directory`);
}

for (const p of [
  'smart-contract/contracts/AetheronGovernance.sol',
  'smart-contract/contracts/AetheronMultiSigTreasury.sol',
  'smart-contract/contracts/AetheronVendor.sol',
]) {
  assert.match(read(p), /NON-PRODUCTION/i, `${p} must carry an explicit NON-PRODUCTION warning`);
  assert.match(read(p), /not authorized for (?:Base )?Mainnet/i, `${p} must explicitly deny mainnet authorization`);
}

const governanceGuide = read('GOVERNANCE_DEPLOYMENT.md');
assert.match(governanceGuide, /historical|archived/i, 'governance deployment guide must be marked historical/archived');
assert.match(governanceGuide, /not production/i, 'governance deployment guide must deny production use');
assert.doesNotMatch(governanceGuide, /--network\s+polygon|polygon-rpc\.com|POLYGONSCAN_API_KEY/i,
  'root governance guide must not contain executable legacy deployment instructions');

assert.doesNotMatch(read('ADVANCED_FEATURES_SUMMARY.md'), /production-ready governance|production-ready code/i,
  'historical governance summary must not claim production readiness');
assert.doesNotMatch(read('TECHNICAL_ENHANCEMENTS_COMPLETE.md'), /Status:\s*Production Ready/i,
  'technical snapshot must not claim global production readiness');

console.log('Experimental governance, custom treasury, and Vendor surfaces are quarantined from production deployment.');