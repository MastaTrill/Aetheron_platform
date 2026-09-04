import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

assert.equal(
  config.buildCommand,
  'npm run build',
  'Vercel must run the same production build validated by CI',
);
assert.equal(
  config.outputDirectory,
  'dist',
  'Vercel must publish only the curated dist artifact',
);
assert.notEqual(
  config.installCommand,
  'npm install --legacy-peer-deps',
  'Vercel must not bypass lockfile/peer-dependency integrity',
);

console.log('Vercel deploys the curated production artifact.');