import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

const source = readFileSync(new URL('./standalone-api.mjs', import.meta.url), 'utf8');

test('standalone deployment uses the audited API and not legacy dashboard server', () => {
  assert.match(source, /import apiApp from '\.\/api-app\.mjs'/);
  assert.match(source, /apiApp\.listen\(port, '0\.0\.0\.0'/);
  assert.doesNotMatch(source, /server\.js|vercel-handler|ADMIN_PASSWORD/);
});

test('standalone deployment validates port and handles shutdown', () => {
  assert.match(source, /Number\.isInteger\(port\)/);
  assert.match(source, /SIGTERM/);
  assert.match(source, /server\.close\(/);
});
