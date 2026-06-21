import request from 'supertest';

const base = 'http://localhost:3001';

describe('Backend API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(base).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/ohlc returns array', async () => {
    const res = await request(base).get('/api/ohlc');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/ingest accepts price', async () => {
    const res = await request(base)
      .post('/api/ingest')
      .send({ price: 1.23 });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
