import request from 'supertest';

let app;
let server;

beforeAll(async () => {
  process.env.PORT = '3001';
  ({ default: app, server } = await import('./server.js'));
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('Backend API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/ohlc returns array', async () => {
    const res = await request(app).get('/api/ohlc');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/ingest accepts price', async () => {
    const res = await request(app)
      .post('/api/ingest')
      .send({ price: 1.23 });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
