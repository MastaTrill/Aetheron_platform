const request = require('supertest');

process.env.ADMIN_PASSWORD = 'test-admin-password';

const app = require('./server');

describe('Backend server', () => {
  it('GET /api returns online status', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
  });

  it('GET /api/tokens returns token registry', async () => {
    const res = await request(app).get('/api/tokens');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /stats returns stats object', async () => {
    const res = await request(app).get('/stats');
    expect(res.statusCode).toBe(401);
  });

  it('GET /settings/export requires auth', async () => {
    const res = await request(app).get('/settings/export');
    expect(res.statusCode).toBe(401);
  });

  it('POST /users/add validates input', async () => {
    const res = await request(app)
      .post('/users/add')
      .set('Authorization', 'Basic ' + Buffer.from('admin:wrong').toString('base64'));
    expect(res.statusCode).toBe(401);
  });

  it('GET /logs/export returns json by default', async () => {
    const res = await request(app).get('/logs/export');
    expect(res.statusCode).toBe(401);
  });
});
