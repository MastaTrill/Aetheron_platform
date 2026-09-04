const request = require('supertest');

process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.AETHERON_OPERATOR_API_KEY = 'test-operator-api-key-0123456789abcdef';
process.env.AETHERON_SIGNER_ROUTES_ENABLED = 'false';

const app = require('./server');

const CANONICAL_AETH = '0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e';
const OPERATOR_AUTH = `Bearer ${process.env.AETHERON_OPERATOR_API_KEY}`;

describe('Local backend server', () => {
  it('GET /api returns Base online status', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.network).toBe('base');
    expect(res.body.chainId).toBe(8453);
  });

  it('GET /api/tokens returns canonical Base AETH registry', async () => {
    const res = await request(app).get('/api/tokens');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const aeth = res.body.find((entry) => String(entry.symbol).toUpperCase() === 'AETH');
    expect(aeth).toBeDefined();
    expect(Number(aeth.chainId)).toBe(8453);
    expect(String(aeth.address).toLowerCase()).toBe(CANONICAL_AETH);
  });

  it('GET /stats requires auth', async () => {
    const res = await request(app).get('/stats');
    expect(res.statusCode).toBe(401);
  });

  it('GET /settings/export requires auth', async () => {
    const res = await request(app).get('/settings/export');
    expect(res.statusCode).toBe(401);
  });

  it('POST /users/add rejects bad auth', async () => {
    const res = await request(app)
      .post('/users/add')
      .set('Authorization', 'Basic ' + Buffer.from('admin:wrong').toString('base64'));
    expect(res.statusCode).toBe(401);
  });

  it('GET /logs/export requires auth', async () => {
    const res = await request(app).get('/logs/export');
    expect(res.statusCode).toBe(401);
  });
});

describe('Production API app', () => {
  let apiApp;

  beforeAll(async () => {
    apiApp = (await import('./api-app.mjs')).default;
  });

  it('GET /health reports Base Mainnet and allows the production origin', async () => {
    const res = await request(apiApp)
      .get('/health')
      .set('Origin', 'https://aetrs.com');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.network).toBe('base');
    expect(res.body.chainId).toBe(8453);
    expect(res.headers['access-control-allow-origin']).toBe('https://aetrs.com');
  });

  it('GET /nft/config is namespaced and Base-pinned', async () => {
    const res = await request(apiApp).get('/nft/config');
    expect(res.statusCode).toBe(200);
    expect(res.body.network).toBe('base');
    expect(res.body.chainId).toBe(8453);
  });

  it.each([
    ['/launch-token', { name: 'Test', symbol: 'TST', supply: '1000' }],
    ['/nft/mint', { tokenURI: 'https://example.com/1.json' }],
    ['/nft/list', { tokenId: '1', price: '0.1' }],
    ['/nft/buy', { listingId: '1' }],
  ])('POST %s rejects unauthenticated server-signing requests', async (path, body) => {
    const res = await request(apiApp).post(path).send(body);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('OPERATOR_AUTH_REQUIRED');
  });

  it('keeps signer routes disabled even for an authenticated operator by default', async () => {
    const res = await request(apiApp)
      .post('/launch-token')
      .set('Authorization', OPERATOR_AUTH)
      .send({ name: 'Test', symbol: 'TST', supply: '1000' });

    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('SIGNER_ROUTES_DISABLED');
  });

  it('rejects unknown API routes without falling through to HTML', async () => {
    const res = await request(apiApp).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('API route not found');
  });
});
