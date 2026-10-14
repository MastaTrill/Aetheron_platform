// Regression tests for payment history API routing on static Cloudflare/GitHub hosting.
// Run with: node --test payment-history.routing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('./payment-history.js', import.meta.url), 'utf8');
function setup(hostname, { globalBase = '', metaBase = '' } = {}) {
  const window = { location: { hostname, origin: 'https://' + hostname }, AETHERON_API_BASE_URL: globalBase };
  const document = { querySelector: () => metaBase ? { getAttribute: () => metaBase } : null };
  const context = vm.createContext({ window, document, URL });
  vm.runInContext(script, context);
  return vm.runInContext('getPaymentHistoryApiBase()', context);
}

test('Cloudflare Worker requires configured backend', () => assert.equal(setup('aetheron.example.workers.dev'), ''));
test('Cloudflare Pages requires configured backend', () => assert.equal(setup('aetheron.pages.dev'), ''));
test('GitHub Pages requires configured backend', () => assert.equal(setup('mastatrill.github.io'), ''));
test('custom domain defaults to same origin', () => assert.equal(setup('www.aetrs.com'), 'https://www.aetrs.com'));
test('explicit backend URL takes priority and trims trailing slash', () => assert.equal(setup('aetheron.pages.dev', { globalBase: 'https://api.example.test/' }), 'https://api.example.test'));
test('meta backend URL is supported', () => assert.equal(setup('aetheron.pages.dev', { metaBase: 'https://api.example.test/' }), 'https://api.example.test'));
test('unconfigured static host cannot silently use Vercel', () => assert.doesNotMatch(script, /vercel-node-app-1\\.vercel\\.app/));
