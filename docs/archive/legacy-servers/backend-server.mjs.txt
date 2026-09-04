import express from 'express';
import path from 'path';

import apiApp from './api-app.mjs';

const app = express();

app.use(express.static(path.join(path.resolve(), '..')));
app.use('/api', apiApp);

app.use((req, res) => {
  res.sendFile(path.join(path.resolve(), '..', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Aetheron backend running on port ${PORT}`);
});
