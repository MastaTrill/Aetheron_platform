import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DB_FILE = "./backend-api/storage-launch.json";

let db = { users: {}, sessions: {}, trades: [] };

try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch {}

function save(){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }

// Wallet login (signature auth)
app.post("/api/auth", async (req,res)=>{
  const {address,signature,message} = req.body;
  try{
    const recovered = ethers.utils.verifyMessage(message, signature);
    if(recovered.toLowerCase() !== address.toLowerCase()){
      return res.status(401).json({error:"invalid signature"});
    }
    const token = Math.random().toString(36).substring(2);
    db.sessions[token] = {address,time:Date.now()};
    db.users[address] = db.users[address] || {created:Date.now()};
    save();
    res.json({token});
  }catch(e){ res.status(500).json({error:"auth failed"}); }
});

// Record trade (with fee model)
app.post("/api/trade", (req,res)=>{
  const {token, pair, amountUsd} = req.body;
  const session = db.sessions[token];
  if(!session) return res.status(401).json({error:"unauthorized"});

  const fee = amountUsd * 0.002; // 0.2% fee model

  const trade = {
    wallet: session.address,
    pair,
    amountUsd,
    fee,
    time: Date.now()
  };

  db.trades.push(trade);
  save();

  res.json({success:true, fee});
});

// Revenue endpoint
app.get("/api/revenue", (req,res)=>{
  const total = db.trades.reduce((a,b)=>a+b.fee,0);
  res.json({revenue: total});
});

app.listen(PORT, ()=> console.log("Launch API running on",PORT));
