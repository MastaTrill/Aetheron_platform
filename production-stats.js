const AETH_TOKEN="0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
let priceChart; let historyLabels=[]; let historyPrices=[];

function fmtMoney(v){ if(v===null||v===undefined||isNaN(v)) return "--"; return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:v<1?8:2}).format(v); }
function fmtNum(v){ if(v===null||v===undefined||isNaN(v)) return "--"; return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(v); }

async function loadStats(){
  const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/polygon/${AETH_TOKEN}`);
  const pairs = await res.json();
  const pair = Array.isArray(pairs) && pairs.length ? pairs.sort((a,b)=>(b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0] : null;
  if(!pair) return;

  const price = Number(pair.priceUsd || 0);
  const liquidity = Number(pair.liquidity?.usd || 0);
  const marketCap = Number(pair.marketCap || pair.fdv || 0);
  const vol24 = Number(pair.volume?.h24 || 0);
  const change24 = Number(pair.priceChange?.h24 || 0);

  document.getElementById("statPrice").innerText = fmtMoney(price);
  document.getElementById("statLiquidity").innerText = fmtMoney(liquidity);
  document.getElementById("statMarketCap").innerText = fmtMoney(marketCap);
  document.getElementById("statVolume").innerText = fmtMoney(vol24);
  document.getElementById("statChange").innerText = `${fmtNum(change24)}%`;

  const stamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  historyLabels.push(stamp); historyPrices.push(price);
  if(historyLabels.length>20){ historyLabels.shift(); historyPrices.shift(); }
  renderPriceChart();
  renderBreakdownChart(liquidity, marketCap, vol24);
}

function renderPriceChart(){
  const ctx = document.getElementById("priceChart");
  if(!ctx) return;
  if(priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {type:"line",data:{labels:historyLabels,datasets:[{label:"AETH Price USD",data:historyPrices,tension:.35,borderWidth:2,fill:false}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#9cadc8"}},y:{ticks:{color:"#9cadc8"}}}}});
}

let breakdownChart;
function renderBreakdownChart(liquidity, marketCap, vol24){
  const ctx = document.getElementById("breakdownChart");
  if(!ctx) return;
  if(breakdownChart) breakdownChart.destroy();
  breakdownChart = new Chart(ctx,{type:"bar",data:{labels:["Liquidity","Market Cap","24h Volume"],datasets:[{data:[liquidity,marketCap,vol24],borderWidth:1}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#9cadc8"}},y:{ticks:{color:"#9cadc8"}}}}});
}

document.addEventListener("DOMContentLoaded",()=>{ loadStats(); setInterval(loadStats,30000); });