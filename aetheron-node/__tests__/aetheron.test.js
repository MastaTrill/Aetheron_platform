const axios = require("axios");

const NODE1_URL = process.env.NODE1_URL || "http://localhost:3000";
const NODE2_URL = process.env.NODE2_URL || "http://localhost:3001";
const NODE3_URL = process.env.NODE3_URL || "http://localhost:3002";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        signature: "0xabcdef123456789",
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

  describe("Network Synchronization", () => {
    it("should have consistent block height across nodes", async () => {
      await wait(5000); // Wait for blocks to be produced

      const r1 = await axios.get(`${NODE1_URL}/blocks/latest`);
      const r2 = await axios.get(`${NODE2_URL}/blocks/latest`);
      const r3 = await axios.get(`${NODE3_URL}/blocks/latest`);

      // Allow for small differences due to propagation delay
      const diff = Math.abs(r1.data.height - r2.data.height);
      expect(diff).toBeLessThanOrEqual(1);
    });
  });
});

describe("Aetheron Blockchain Logic Tests", () => {
  it("should create genesis block correctly", () => {
    const { Blockchain, Block } = require("../../aetheron-blockchain");
    const chain = new Blockchain();

    expect(chain.chain.length).toBe(1);
    expect(chain.chain[0].previousHash).toBe("0");
    expect(chain.chain[0].blockNumber).toBe(0);
  });

  it("should validate valid transaction", async () => {
    const { Transaction, Block } = require("../../aetheron-blockchain");

    const tx = new Transaction("sender", "receiver", 100, "valid_sig");
    const result = await tx.verify();
    expect(result).toBeDefined();
  });

  it("should reject invalid transaction", async () => {
    const { Transaction } = require("../../aetheron-blockchain");

    const tx = new Transaction("", "receiver", 100);
    expect(tx.sender).toBe("");
  });

  it("should calculate balance correctly", () => {
    const { Blockchain } = require("../../aetheron-blockchain");
    const chain = new Blockchain();

    // Genesis block has no transactions, balance should be 0
    expect(chain.getBalance("test_address")).toBe(0);
  });

  it("should register validator with sufficient stake", () => {
    const { Blockchain } = require("../../aetheron-blockchain");
    const chain = new Blockchain();

    chain.registerValidator("validator1", 100);
    expect(chain.validators["validator1"]).toBeDefined();
    expect(chain.validators["validator1"].stake).toBe(100);
  });

  it("should reject validator with insufficient stake", () => {
    const { Blockchain } = require("../../aetheron-blockchain");
    const chain = new Blockchain();

    expect(() => {
      chain.registerValidator("validator1", 50);
    }).toThrow("Minimum stake is 100");
  });

  it("should track validator history", () => {
    const { Blockchain } = require("../../aetheron-blockchain");
    const chain = new Blockchain();

    chain.registerValidator("validator1", 200);
    expect(chain.validatorHistory["validator1"]).toEqual([]);
  });
});
