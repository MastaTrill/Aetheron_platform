// Standalone deployment entrypoint for the audited API, separate from the legacy dashboard server.
import apiApp from './api-app.mjs';

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const server = apiApp.listen(port, '0.0.0.0', () => {
  console.log('Aetheron audited API listening on port ' + port);
});

function shutdown(signal) {
  console.log('Received ' + signal + '; stopping Aetheron API');
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
