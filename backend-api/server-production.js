import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "storage");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const API_KEY = process.env.INTERNAL_API_KEY || "dev-key";

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.use(cors({ origin: ORIGIN === "*" ? true : ORIGIN.split(",") }));
app.use(express.json({ limit: "1mb" }));

let db = {
  prices: [],
  candles: { "1m": [], "5m": [], "1h": [] },
  trades: [],
  portfolioSnapshots: []
};

function loadDb() {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {}
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function now() {
  return Date.now();
}

function bucketTime(ts, intervalMs) {
  return Math.floor(ts / intervalMs) * intervalMs;
}

function updateCandles(price, ts) {
  const defs = [
    ["1m", 60_000],
    ["5m", 300_000],
    ["1h", 3_600_000]
  ];

  for (const [key, ms] of defs) {
    const bucket = bucketTime(ts, ms);
    const candles = db.candles[key] || [];
    const last = candles[candles.length - 1];

    if (!last || last.time !== bucket) {
      candles.push({ time: bucket, open: price, high: price, low: price, close: price, volume: 0 });
    } else {
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      last.close = price;
    }

    if (candles.length > 1000) candles.shift();
    db.candles[key] = candles;
  }
}

function requireInternalKey(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (key !== API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, time: now() });
  for (const client of clients) {
    if (client.readyState === 1) client.send(message);
  }
}

loadDb();

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "aetheron-production-api", time: now() });
});

app.get("/api/candles", (req, res) => {
  const interval = req.query.interval || "1m";
  const limit = Math.min(Number(req.query.limit || 200), 1000);
  res.json((db.candles[interval] || []).slice(-limit));
});

app.get("/api/trades", (req, res) => {
  const wallet = String(req.query.wallet || "").toLowerCase();
  const rows = wallet ? db.trades.filter(t => String(t.wallet || "").toLowerCase() === wallet) : db.trades;
  res.json(rows.slice(-200).reverse());
});

app.get("/api/portfolio-snapshots", (req, res) => {
  const wallet = String(req.query.wallet || "").toLowerCase();
  const rows = wallet ? db.portfolioSnapshots.filter(t => String(t.wallet || "").toLowerCase() === wallet) : db.portfolioSnapshots;
  res.json(rows.slice(-500));
});

app.post("/api/ingest-price", requireInternalKey, (req, res) => {
  const price = Number(req.body.price);
  if (!price || Number.isNaN(price)) {
    return res.status(400).json({ error: "invalid price" });
  }
  const ts = now();
  db.prices.push({ time: ts, price });
  if (db.prices.length > 5000) db.prices.shift();
  updateCandles(price, ts);
  saveDb();
  broadcast("price", { price });
  res.json({ ok: true });
});

app.post("/api/record-trade", (req, res) => {
  const trade = {
    time: now(),
    wallet: req.body.wallet || "",
    pair: req.body.pair || "",
    route: req.body.route || "",
    inputAmount: req.body.inputAmount || "",
    outputAmount: req.body.outputAmount || "",
    txHash: req.body.txHash || "",
    status: req.body.status || "confirmed"
  };
  db.trades.push(trade);
  if (db.trades.length > 5000) db.trades.shift();
  saveDb();
  broadcast("trade", trade);
  res.json({ ok: true, trade });
});

app.post("/api/record-portfolio", (req, res) => {
  const row = {
    time: now(),
    wallet: req.body.wallet || "",
    totalUsd: Number(req.body.totalUsd || 0),
    positions: Array.isArray(req.body.positions) ? req.body.positions : []
  };
  db.portfolioSnapshots.push(row);
  if (db.portfolioSnapshots.length > 5000) db.portfolioSnapshots.shift();
  saveDb();
  res.json({ ok: true });
});

const server = app.listen(PORT, () => {
  console.log(`Aetheron production API listening on ${PORT}`);
});

const wss = new WebSocketServer({ server, path: "/ws" });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "hello", payload: { ok: true, service: "aetheron-ws" }, time: now() }));
  ws.on("close", () => clients.delete(ws));
});
