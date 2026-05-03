const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { Blockchain } = require('../aetheron-blockchain');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const NODE_NAME = process.env.NODE_NAME || "aetheron-node";
const METRICS_PORT = process.env.METRICS_PORT || 8080;
const RPC_PORT = process.env.RPC_PORT || 8545;

let blockchain = new Blockchain();
let connectedPeers = [];

// Initialize some validators
blockchain.registerValidator("validator1", 1000);
blockchain.registerValidator("validator2", 1000);
blockchain.registerValidator("validator3", 1000);

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "running",
    node: NODE_NAME,
    blockHeight: blockchain.getLatestBlock().blockNumber,
    peers: connectedPeers.length,
    timestamp: new Date().toISOString(),
  });
});

// Get current block
app.get("/blocks/latest", (req, res) => {
  const latest = blockchain.getLatestBlock();
  res.json({ height: latest.blockNumber, timestamp: latest.timestamp });
});

// Get block by number
app.get("/blocks/:number", (req, res) => {
  const num = parseInt(req.params.number);
  if (num > blockCount) {
    return res.status(404).json({ error: "Block not found" });
  }
  res.json({
    number: num,
    hash: `blockhash_${num}`,
    validator: `validator_${num % 3}`,
  });
});

// Get blockchain info
app.get("/chain", (req, res) => {
  const stats = blockchain.getStats();
  res.json({
    length: stats.chainLength,
    validators: stats.validators,
    network: "aetheron-testnet",
  });
});

// Send transaction
app.post("/transactions", (req, res) => {
  const { to, from, amount, signature } = req.body;
  if (!to || !amount) {
    return res.status(400).json({ error: "Invalid transaction" });
  }
  transactionCount++;
  res.json({
    txHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    block: blockCount + 1,
  });
});

// RPC endpoint
app.post("/rpc", (req, res) => {
  const { method, params, id } = req.body;

  switch (method) {
    case "eth_blockNumber":
      res.json({ result: "0x" + blockchain.getLatestBlock().blockNumber.toString(16), id });
      break;
    case "eth_getBalance":
      res.json({ result: "0x" + (Math.random() * 1000000).toString(16), id });
      break;
    case "eth_call":
      res.json({ result: "0x", id });
      break;
    default:
      res.json({ error: "Method not found", id });
  }
});

// Metrics endpoint for Prometheus
app.get("/metrics", (req, res) => {
  const stats = blockchain.getStats();
  const metrics = [
    `# HELP aetheron_block_height Current block height`,
    `# TYPE aetheron_block_height gauge`,
    `aetheron_block_height ${stats.chainLength - 1}`,
    `# HELP aetheron_transactions_total Total transactions processed`,
    `# TYPE aetheron_transactions_total counter`,
    `aetheron_transactions_total ${stats.totalTransactions}`,
    `# HELP aetheron_peers_connected Number of connected peers`,
    `# TYPE aetheron_peers_connected gauge`,
    `aetheron_peers_connected ${connectedPeers.length}`,
    `# HELP aetheron_validator_stake Validator stake amount`,
    `# TYPE aetheron_validator_stake gauge`,
    `aetheron_validator_stake{node="${NODE_NAME}"} ${stats.totalStaked}`,
    `# HELP aetheron_block_time_ms Block creation time in ms`,
    `# TYPE aetheron_block_time_ms gauge`,
    `aetheron_block_time_ms ${Math.floor(Math.random() * 2000 + 1000)}`,
  ].join("\n");

  res.set("Content-Type", "text/plain");
  res.send(metrics);
});

// WebSocket for P2P
wss.on("connection", (ws) => {
  console.log("New peer connected");
  connectedPeers.push(ws);

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "new_block") {
      blockCount = data.height;
      lastBlockTime = Date.now();
      // Broadcast to other peers
      connectedPeers.forEach((peer) => {
        if (peer !== ws && peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on("close", () => {
    connectedPeers = connectedPeers.filter((peer) => peer !== ws);
  });
});

// Simulate block production
setInterval(async () => {
  try {
    // Add some mock transactions
    const numTx = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numTx; i++) {
      const tx = { sender: "mock_sender", receiver: "mock_receiver", amount: Math.random() * 10 };
      await blockchain.addTransaction(tx);
    }

    const newBlock = await blockchain.createBlock();
    const blockData = {
      type: "new_block",
      height: newBlock.blockNumber,
      timestamp: newBlock.timestamp,
    };

    connectedPeers.forEach((peer) => {
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify(blockData));
      }
    });

    console.log(
      `[${NODE_NAME}] New block: #${newBlock.blockNumber}, TXs: ${newBlock.transactions.length}`,
    );
  } catch (error) {
    console.error("Block creation failed:", error.message);
  }
}, 10000);

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     AETHERON NODE - ${NODE_NAME.padEnd(22)}║
╠═══════════════════════════════════════════╣
║  HTTP API:     http://localhost:${PORT}         ║
║  Metrics:      http://localhost:${METRICS_PORT}       ║
║  RPC:          http://localhost:${RPC_PORT}          ║
║  WebSocket:    ws://localhost:${PORT}/ws          ║
╚═══════════════════════════════════════════╝
    `);
});

server.listen(METRICS_PORT, "0.0.0.0", () => {
  console.log(`Metrics server listening on port ${METRICS_PORT}`);
});
