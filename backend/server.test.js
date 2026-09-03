const request = require('supertest');

process.env.ADMIN_PASSWORD = 'test-admin-password';

const app = require('./server');

const CANONICAL_AETH = '0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e';

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

  it('rejects unknown API routes without falling through to HTML', async () => {
    const res = await request(apiApp).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('API route not found');
  });
});
