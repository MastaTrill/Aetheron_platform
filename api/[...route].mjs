import apiApp from '../backend/api-app.mjs';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }

  return apiApp(req, res);
}
