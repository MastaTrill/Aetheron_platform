import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get("/api/health", (req,res)=>{
  res.json({status:"ok", service:"aetheron-backend"});
});

// Market data proxy (Dexscreener)
app.get("/api/market/:token", async (req,res)=>{
  try{
    const token = req.params.token;
    const r = await fetch(`https://api.dexscreener.com/token-pairs/v1/polygon/${token}`);
    const data = await r.json();
    res.json(data);
  }catch(e){
    res.status(500).json({error:"market fetch failed"});
  }
});

// OHLC (synthetic from live stream)
let priceHistory = [];
app.get("/api/ohlc", (req,res)=>{
  const ohlc = priceHistory.slice(-50);
  res.json(ohlc);
});

// ingest price (called by frontend)
app.post("/api/ingest", (req,res)=>{
  const {price} = req.body;
  if(price){
    priceHistory.push({time:Date.now(), price});
    if(priceHistory.length>500) priceHistory.shift();
  }
  res.json({ok:true});
});

app.listen(PORT, ()=>{
  console.log("Aetheron backend running on", PORT);
});
