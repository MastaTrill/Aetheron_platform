import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('./dashboard-enhanced.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./dashboard-enhanced.js', import.meta.url), 'utf8');

test('enhanced dashboard does not trust legacy Vercel API', () => {
  assert.doesNotMatch(html, /vercel-node-app-1\\.vercel\\.app/);
  assert.doesNotMatch(js, /vercel-node-app-1\\.vercel\\.app/);
});
test('dashboard requires explicit backend configuration', () => {
  assert.match(html, /name="aetheron-api-base" content=""/);
  assert.match(js, /const configuredBase = globalBase \\|\\| metaBase \\|\\| '';/);
  assert.match(js, /if \(configuredBase\) return configuredBase\.replace/);
  assert.match(js, /return '';/);
  assert.doesNotMatch(js, /window\.location\.origin/);
  assert.match(js, /if \(!apiBase\)/);
});
