import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('./dashboard.js', import.meta.url), 'utf8');

assert.doesNotMatch(
  source,
  /\.innerHTML\s*=/,
  'dashboard.js must not assign HTML strings through innerHTML',
);

assert.doesNotMatch(
  source,
  /function\s+setContainerHtml\s*\(/,
  'dashboard.js must not retain the generic HTML container helper',
);

assert.doesNotMatch(
  source,
  /createDashboardModal\s*\(\s*`/,
  'dashboard modals must be built from DOM nodes instead of HTML template strings',
);

console.log('✅ dashboard.js source-native DOM safety checks passed');
