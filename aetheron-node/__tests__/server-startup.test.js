const { spawn } = require('child_process');
const path = require('path');

const waitForHealth = async (url, child, timeoutMs = 8000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`server exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw lastError || new Error('server health endpoint did not become ready');
};

describe('aetheron node process startup', () => {
  jest.setTimeout(15000);

  test('starts cleanly and serves core API routes', async () => {
    const port = 3199;
    const cwd = path.resolve(__dirname, '..');
    const child = spawn(process.execPath, ['server.js'], {
      cwd,
      env: { ...process.env, PORT: String(port), NODE_NAME: 'startup-regression' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    try {
      const health = await waitForHealth(`http://127.0.0.1:${port}/health`, child);
      expect(health.status).toBe('running');

      const block = await fetch(`http://127.0.0.1:${port}/blocks/0`);
      expect(block.status).toBe(200);

      const valid = await fetch(`http://127.0.0.1:${port}/transactions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'alice', to: 'bob', amount: 1 }),
      });
      expect(valid.status).toBe(200);

      for (const body of [
        { to: 'bob', amount: 1 },
        { from: 'alice', to: 'bob', amount: -1 },
        { from: 'alice', to: 'bob', amount: '1' },
      ]) {
        const invalid = await fetch(`http://127.0.0.1:${port}/transactions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        expect(invalid.status).toBe(400);
      }
    } catch (error) {
      throw new Error(`${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    } finally {
      child.kill('SIGTERM');
      await new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once('exit', resolve);
        setTimeout(resolve, 1500);
      });
    }
  });
});
