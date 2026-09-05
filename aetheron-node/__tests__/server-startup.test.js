const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForHealth(port, child, stderr) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`server exited before health check: ${stderr.value}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return response.json();
    } catch {
      // Server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`server never became healthy: ${stderr.value}`);
}

test("node server starts and answers health under the root ESM package", async () => {
  const port = await getFreePort();
  const stderr = { value: "" };
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stderr.on("data", (chunk) => {
    stderr.value += chunk.toString();
  });

  try {
    const health = await waitForHealth(port, child, stderr);
    expect(health.status).toBe("running");
    expect(health.node).toBeDefined();
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
  }
}, 10000);

async function waitForBlockHeight(port, child, stderr) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`server exited before producing a block: ${stderr.value}`);
    }

    const response = await fetch(`http://127.0.0.1:${port}/blocks/latest`);
    const block = await response.json();
    if (block.height > 0) return block.height;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`block height never advanced: ${stderr.value}`);
}

test("periodic block production advances the chain", async () => {
  const port = await getFreePort();
  const stderr = { value: "" };
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PORT: String(port), BLOCK_INTERVAL_MS: "100" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stderr.on("data", (chunk) => {
    stderr.value += chunk.toString();
  });

  try {
    await waitForHealth(port, child, stderr);
    const height = await waitForBlockHeight(port, child, stderr);
    expect(height).toBeGreaterThan(0);
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
  }
}, 10000);
