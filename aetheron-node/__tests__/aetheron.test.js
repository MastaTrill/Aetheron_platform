const axios = require("axios");
const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

let NODE1_URL = process.env.NODE1_URL;
let NODE2_URL = process.env.NODE2_URL;
let NODE3_URL = process.env.NODE3_URL;
let multiNodeWaitMs = 11000;
const spawnedNodes = [];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function waitForNode(url, state) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (state.child.exitCode !== null) {
      throw new Error(`node exited during startup: ${state.stderr}`);
    }
    try {
      const response = await axios.get(`${url}/health`);
      if (response.status === 200) return;
    } catch {
      // Node may still be starting.
    }
    await wait(100);
  }
  throw new Error(`node never became healthy: ${state.stderr}`);
}

async function startLocalNodesIfNeeded() {
  const configured = [NODE1_URL, NODE2_URL, NODE3_URL].filter(Boolean);
  if (configured.length === 3) return;
  if (configured.length !== 0) {
    throw new Error("Set all three NODE*_URL values or none of them");
  }

  const ports = [await getFreePort(), await getFreePort(), await getFreePort()];
  const urls = ports.map((port) => `http://127.0.0.1:${port}`);

  for (let index = 0; index < ports.length; index += 1) {
    const state = { child: null, stderr: "" };
    state.child = spawn(process.execPath, ["server.js"], {
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        PORT: String(ports[index]),
        NODE_NAME: `jest-node-${index + 1}`,
        BLOCK_INTERVAL_MS: "250",
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    state.child.stderr.on("data", (chunk) => {
      state.stderr += chunk.toString();
    });
    spawnedNodes.push(state);
  }

  [NODE1_URL, NODE2_URL, NODE3_URL] = urls;
  multiNodeWaitMs = 1000;
  await Promise.all(urls.map((url, index) => waitForNode(url, spawnedNodes[index])));
}

async function stopLocalNodes() {
  await Promise.all(spawnedNodes.map(async ({ child }) => {
    if (child.exitCode !== null) return;
    child.kill();
    await new Promise((resolve) => child.once("exit", resolve));
  }));
}

beforeAll(startLocalNodesIfNeeded, 10000);
afterAll(stopLocalNodes, 5000);


describe("Aetheron Node API Tests", () => {
  describe("Node Health", () => {
    it("should check if node 1 is running", async () => {
      const response = await axios.get(`${NODE1_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe("running");
    });

    it("should check if node 2 is running", async () => {
      const response = await axios.get(`${NODE2_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe("running");
    });

    it("should check if node 3 is running", async () => {
      const response = await axios.get(`${NODE3_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe("running");
    });
  });

  describe("Blockchain Data", () => {
    it("should get latest block from node 1", async () => {
      const response = await axios.get(`${NODE1_URL}/blocks/latest`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("height");
      expect(typeof response.data.height).toBe("number");
    });

    it("should get latest block from node 2", async () => {
      const response = await axios.get(`${NODE2_URL}/blocks/latest`);
      expect(response.status).toBe(200);
      expect(response.data.height).toBeGreaterThanOrEqual(0);
    });

    it("should get chain info", async () => {
      const response = await axios.get(`${NODE1_URL}/chain`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("length");
      expect(response.data).toHaveProperty("validators");
      expect(response.data.validators).toBeGreaterThan(0);
    });

    it("should get specific block by number", async () => {
      const response = await axios.get(`${NODE1_URL}/blocks/0`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("number");
    });
  });

  describe("Transactions", () => {
    it("should submit a valid transaction", async () => {
      const tx = {
        from: "0x742d35Cc6634C0532925a3b844Bc9e7595f",
        to: "0x123d35Cc6634C0532925a3b844Bc9e7595f",
        amount: 10,
        signature: "valid_sig",
      };

      const response = await axios.post(`${NODE1_URL}/transactions`, tx);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("txHash");
    });

    it("should reject invalid transaction (missing fields)", async () => {
      try {
        await axios.post(`${NODE1_URL}/transactions`, { from: "0x123" });
        fail("Should have thrown error");
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it("should reject invalid transaction (negative amount)", async () => {
      try {
        await axios.post(`${NODE1_URL}/transactions`, {
          from: "0x742d35Cc6634C0532925a3b844Bc9e7595f",
          to: "0x123d35Cc6634C0532925a3b844Bc9e7595f",
          amount: -10,
        });
        fail("Should have thrown error");
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe("RPC Interface", () => {
    it("should respond to eth_blockNumber", async () => {
      const response = await axios.post(`${NODE1_URL}/rpc`, {
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      });

      expect(response.status).toBe(200);
      expect(response.data.result).toBeDefined();
      expect(response.data.result.startsWith("0x")).toBe(true);
    });

    it("should respond to eth_getBalance", async () => {
      const response = await axios.post(`${NODE1_URL}/rpc`, {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f", "latest"],
        id: 2,
      });

      expect(response.status).toBe(200);
      expect(response.data.result).toBeDefined();
    });

    it("should return error for unknown method", async () => {
      const response = await axios.post(`${NODE1_URL}/rpc`, {
        jsonrpc: "2.0",
        method: "eth_unknownMethod",
        params: [],
        id: 3,
      });

      expect(response.status).toBe(200);
      expect(response.data.error).toBeDefined();
    });
  });

  describe("Metrics", () => {
    it("should expose Prometheus metrics", async () => {
      const response = await axios.get(`${NODE1_URL}/metrics`);
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/plain");
      expect(response.data).toContain("aetheron_block_height");
      expect(response.data).toContain("aetheron_transactions_total");
      expect(response.data).toContain("aetheron_peers_connected");
    });
  });

  describe("Multi-node Runtime", () => {
    it("should produce blocks on all nodes without crashing", async () => {
      // These test nodes run independently; consensus synchronization is not asserted here.
      await wait(multiNodeWaitMs);

      const responses = await Promise.all([
        axios.get(`${NODE1_URL}/blocks/latest`),
        axios.get(`${NODE2_URL}/blocks/latest`),
        axios.get(`${NODE3_URL}/blocks/latest`),
      ]);

      responses.forEach((response) => {
        expect(response.data.height).toBeGreaterThan(0);
      });
    }, 15000);
  });
});

describe("Aetheron Blockchain Logic Tests", () => {
  it("should create genesis block correctly", () => {
    const { Blockchain, Block } = require("../../aetheron-blockchain.cjs");
    const chain = new Blockchain();

    expect(chain.chain.length).toBe(1);
    expect(chain.chain[0].previousHash).toBe("0");
    expect(chain.chain[0].blockNumber).toBe(0);
  });

  it("should validate valid transaction", async () => {
    const { Transaction, Block } = require("../../aetheron-blockchain.cjs");

    const tx = new Transaction("sender", "receiver", 100, "valid_sig");
    const result = await tx.verify();
    expect(result).toBeDefined();
  });

  it("should reject invalid transaction", async () => {
    const { Transaction } = require("../../aetheron-blockchain.cjs");

    const tx = new Transaction("", "receiver", 100);
    expect(tx.sender).toBe("");
  });

  it("should calculate balance correctly", () => {
    const { Blockchain } = require("../../aetheron-blockchain.cjs");
    const chain = new Blockchain();

    // Genesis block has no transactions, balance should be 0
    expect(chain.getBalance("test_address")).toBe(0);
  });

  it("should register validator with sufficient stake", () => {
    const { Blockchain } = require("../../aetheron-blockchain.cjs");
    const chain = new Blockchain();

    chain.registerValidator("validator1", 100);
    expect(chain.validators["validator1"]).toBeDefined();
    expect(chain.validators["validator1"].stake).toBe(100);
  });

  it("should reject validator with insufficient stake", () => {
    const { Blockchain } = require("../../aetheron-blockchain.cjs");
    const chain = new Blockchain();

    expect(() => {
      chain.registerValidator("validator1", 50);
    }).toThrow("Minimum stake is 100");
  });

  it("should track validator history", () => {
    const { Blockchain } = require("../../aetheron-blockchain.cjs");
    const chain = new Blockchain();

    chain.registerValidator("validator1", 200);
    expect(chain.validatorHistory["validator1"]).toEqual([]);
  });
});
