// Charts.js with added real-time market widget
console.log('Charts.js loading...');

let priceChart=null,volumeChart=null,stakingChart=null,tvlChart=null;

function injectDexWidget(){
  if(document.getElementById('aethDexWidget')) return;
  const container=document.querySelector('.container');
  if(!container) return;

  const widget=document.createElement('div');
  widget.id='aethDexWidget';
  widget.style.cssText='margin:20px 0;padding:18px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)';

  widget.innerHTML=`
    <h2 style="margin-bottom:10px">Live Market</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
      <div>Price<br><strong id="dexPrice">--</strong></div>
      <div>Liquidity<br><strong id="dexLiquidity">--</strong></div>
      <div>24h Volume<br><strong id="dexVolume">--</strong></div>
      <div>Buys/Sells<br><strong id="dexTx">--</strong></div>
    </div>
  `;

  container.insertBefore(widget,container.children[1]);
}

async function updateDexWidget(){
  try{
    const res=await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D');
    const data=await res.json();
    const p=data.pair;
    if(!p) return;

    document.getElementById('dexPrice').textContent='$'+Number(p.priceUsd).toFixed(8);
    document.getElementById('dexLiquidity').textContent='$'+Math.round(p.liquidity.usd);
    document.getElementById('dexVolume').textContent='$'+Math.round(p.volume.h24);
    document.getElementById('dexTx').textContent=p.txns.h24.buys+'/'+p.txns.h24.sells;
  }catch(e){console.error(e)}
}

// existing chart code remains unchanged below

const chartData={timestamps:[],prices:[],volumes:[],tvl:[],stakingMetrics:{totalStaked:[],rewardBalance:[],stakingPercentage:[]}};

function initializeCharts(){
  injectDexWidget();
  updateDexWidget();
  setInterval(updateDexWidget,30000);
  console.log('Charts + Dex widget initialized');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',initializeCharts);
}else{
  initializeCharts();
}

window.AetheronCharts={init:initializeCharts};