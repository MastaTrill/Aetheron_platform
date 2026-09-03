import express from 'express';
import apiApp from './api-app.mjs';

const app = express();

app.disable('x-powered-by');
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'aetheron-backend-api',
    api: '/api',
    network: 'base',
    chainId: 8453,
  });
});
app.use('/api', apiApp);
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

export default app;
