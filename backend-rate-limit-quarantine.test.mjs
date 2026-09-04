import fs from 'node:fs';
import assert from 'node:assert/strict';

const obsoleteRuntimePaths = [
  'backend-api/server-scale.js',
  'backend-api/server-launch.js',
  'backend-api/package.scale.json',
  'backend-api/package.launch.json',
  'backend/server.mjs',
  'backend/scanner/all-payments-backend.js',
];

for (const file of obsoleteRuntimePaths) {
  assert.equal(fs.existsSync(file), false, `obsolete runtime must be quarantined: ${file}`);
}

console.log('Obsolete duplicate backend runtimes are quarantined.');
