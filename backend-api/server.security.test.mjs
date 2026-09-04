import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.PORT = '0';
const outbound = [];
globalThis.fetch = async (url) => {
  outbound.push(String(url));
  return { json: async () => ({ ok: true }) };
};

const { server } = await import(`./server.js?security=${Date.now()}`);

function request(path) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}
test('market proxy validates input before outbound fetch', async (t) => {
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const invalid = await request('/api/market/not-an-address');
  assert.equal(invalid.status, 400);
  assert.equal(outbound.length, 0);

  const token = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
  const valid = await request(`/api/market/${token}`);
  assert.equal(valid.status, 200);
  assert.equal(outbound.length, 1);
  assert.equal(
    outbound[0],
    `https://api.dexscreener.com/token-pairs/v1/base/${token}`
  );
});
