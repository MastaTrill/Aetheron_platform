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

test('dashboard communicates async results accessibly and bounds API requests', () => {
  assert.ok(js.includes("element.setAttribute('role', tone === 'error' || tone === 'warning' ? 'alert' : 'status')"));
  assert.ok(js.includes("element.setAttribute('aria-live', tone === 'error' || tone === 'warning' ? 'assertive' : 'polite')"));
  assert.ok(js.includes("element.setAttribute('aria-atomic', 'true')"));
  assert.ok(js.includes('signal: AbortSignal.timeout(30000)'));
});

test('dashboard explains network failures and timeouts without exposing technical errors', () => {
  assert.ok(js.includes("error.name === 'TimeoutError' || error.name === 'AbortError'"));
  assert.ok(js.includes('The Aetheron API took too long to respond. Please try again.'));
  assert.ok(js.includes('Unable to reach the Aetheron API. Check your connection and try again.'));
});
