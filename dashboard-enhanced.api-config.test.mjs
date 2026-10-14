import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('./dashboard-enhanced.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./dashboard-enhanced.js', import.meta.url), 'utf8');

test('enhanced dashboard does not trust legacy Vercel API', () => {
  assert.ok(!html.includes('vercel-node-app-1.vercel.app'));
  assert.ok(!js.includes('vercel-node-app-1.vercel.app'));
});
test('dashboard requires explicit backend configuration', () => {
  assert.ok(html.includes('name="aetheron-api-base" content=""'));
  assert.ok(js.includes("const configuredBase = globalBase || metaBase || '';"));
  assert.ok(js.includes('if (configuredBase) return configuredBase.replace'));
  assert.ok(js.includes("return '';"));
  assert.ok(!js.includes('window.location.origin'));
  assert.ok(js.includes('if (!apiBase)'));
});
