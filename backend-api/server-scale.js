import express from "express";
import cors from "cors";
import pkg from "pg";
import { WebSocketServer } from "ws";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PORT = process.env.PORT || 3000;

// Health
app.get('/health', (_req,res)=>res.json({status:'ok'}));

// Track event
app.post('/event', async (req,res)=>{
  const { wallet, type, metadata } = req.body;
  await pool.query(
    'INSERT INTO events(wallet,event_type,metadata) VALUES($1,$2,$3)',
    [wallet, type, metadata || {}]
  );
  broadcast('event',{wallet,type});
  res.json({ok:true});
});

// Trades
app.post('/trade', async (req,res)=>{
  const { wallet, pair, amount, tx } = req.body;
  await pool.query(
    'INSERT INTO trades(wallet,pair,amount,tx_hash) VALUES($1,$2,$3,$4)',
    [wallet,pair,amount,tx]
  );
  broadcast('trade',{wallet,pair,amount});
  res.json({ok:true});
});

// Metrics
app.get('/metrics', async (_req,res)=>{
  const users = await pool.query('SELECT COUNT(DISTINCT wallet) FROM events');
  const trades = await pool.query('SELECT COUNT(*) FROM trades');
  res.json({users:users.rows[0].count,trades:trades.rows[0].count});
});

const server = app.listen(PORT,()=>console.log('Scale API running'));

// WebSocket
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection',(ws)=>{
  clients.add(ws);
  ws.on('close',()=>clients.delete(ws));
});

function broadcast(type,data){
  const msg = JSON.stringify({type,data});
  clients.forEach(c=>c.send(msg));
}
