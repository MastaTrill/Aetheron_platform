// Non-mutating, unauthenticated live checks for the isolated Render API.
// No credentials, wallet operations, payments, or authenticated requests.
import assert from 'node:assert/strict';

const base = process.env.AETHERON_PREVIEW_API_URL || 'https://aetheron-api-cert-preview.onrender.com';
const origin = 'https://aetrs.com';
const unknownOrigin = 'https://not-aetheron.example';

async function check(path, options, expectedStatus) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(45000), ...options });
  assert.equal(response.status, expectedStatus, path + ': unexpected HTTP status');
  return response;
}

const health = await check('/health', {}, 200);
const status = await health.json();
assert.equal(status.status, 'ok');
assert.equal(status.service, 'aetheron-backend-api');
assert.equal(status.chainId, 8453);
assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
console.log('PASS health and security header');

const nft = await (await check('/nft/config', {}, 200)).json();
assert.equal(nft.chainId, 8453);
assert.equal(nft.configured, false, 'Preview must not expose live NFT configuration');
console.log('PASS NFT configuration safely unavailable');

const allowed = await check('/health', { headers: { Origin: origin } }, 200);
assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
assert.match(allowed.headers.get('vary') || '', /Origin/i);
const denied = await check('/health', { headers: { Origin: unknownOrigin } }, 200);
assert.equal(denied.headers.get('access-control-allow-origin'), null);
console.log('PASS allowlisted CORS and unknown-origin denial');

const preflight = await check('/health', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } }, 204);
assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
console.log('PASS CORS preflight');

for (const path of ['/launch-token', '/nft/mint', '/nft/list', '/nft/buy']) {
  const response = await fetch(new URL(path, base), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(45000) });
  const body = await response.json();
  assert.ok(
    (response.status === 401 && body.code === 'OPERATOR_AUTH_REQUIRED') ||
    (response.status === 503 && body.code === 'OPERATOR_AUTH_NOT_CONFIGURED'),
    path + ': unexpected auth guard: ' + response.status + ' ' + body.code,
  );
}
console.log('PASS unauthenticated financial writes rejected');

const missing = await check('/nonexistent-acceptance-route', {}, 404);
assert.match(missing.headers.get('content-type') || '', /application\/json/);
console.log('PASS unknown routes return JSON 404');
console.log('PASS isolated preview acceptance (read-only and unauthenticated)');
