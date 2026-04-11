import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let db = { prices: [] };

function saveDB(){ fs.writeFileSync("./backend-api/data.json", JSON.stringify(db)); }
function loadDB(){ try{ db = JSON.parse(fs.readFileSync("./backend-api/data.json")); }catch{} }
loadDB();

app.get("/api/ohlc", (req,res)=> res.json(db.prices.slice(-100)));

app.post("/api/ingest", (req,res)=>{
  const {price} = req.body;
  if(price){
    db.prices.push({time:Date.now(),price});
    if(db.prices.length>1000) db.prices.shift();
    saveDB();
    broadcast({price});
  }
  res.json({ok:true});
});

const server = app.listen(PORT, ()=> console.log("Realtime backend running"));

const wss = new WebSocketServer({ server });
let clients = [];

wss.on("connection", (ws)=>{
  clients.push(ws);
  ws.on("close", ()=> clients = clients.filter(c=>c!==ws));
});

function broadcast(data){
  clients.forEach(ws=>{
    if(ws.readyState===1) ws.send(JSON.stringify(data));
  });
}
