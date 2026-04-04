function renderInstitutionalAI(){
  const price = parseFloat((document.getElementById('statPrice')||{}).innerText?.replace(/[^0-9.\-]/g,'')) || 0;
  const volume = parseFloat((document.getElementById('statVolume')||{}).innerText?.replace(/[^0-9.\-]/g,'')) || 0;
  const liquidity = parseFloat((document.getElementById('statLiquidity')||{}).innerText?.replace(/[^0-9.\-]/g,'')) || 0;
  const change = parseFloat((document.getElementById('statChange')||{}).innerText?.replace(/[^0-9.\-]/g,'')) || 0;

  let trend = 'Neutral';
  if(change > 3) trend = 'Bullish';
  else if(change < -3) trend = 'Bearish';

  let risk = 'Medium';
  if(liquidity > 100000 && Math.abs(change) < 8) risk = 'Low';
  else if(liquidity < 25000 || Math.abs(change) > 15) risk = 'High';

  let action = 'Monitor';
  if(trend === 'Bullish' && risk !== 'High') action = 'Accumulation zone';
  if(trend === 'Bearish' && risk === 'High') action = 'Risk-off posture';

  const score = Math.max(0, Math.min(100, Math.round((liquidity/1000) + (volume/2000) - Math.abs(change)*2)));

  if(document.getElementById('aiTrend')) document.getElementById('aiTrend').innerText = trend;
  if(document.getElementById('aiRisk')) document.getElementById('aiRisk').innerText = risk;
  if(document.getElementById('aiAction')) document.getElementById('aiAction').innerText = action;
  if(document.getElementById('aiScore')) document.getElementById('aiScore').innerText = String(score);
  if(document.getElementById('instNote')) document.getElementById('instNote').innerText = 'Liquidity ' + liquidity.toLocaleString() + ' | Volume ' + volume.toLocaleString() + ' | Price ' + price;
}

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(renderInstitutionalAI, 2500);
  setInterval(renderInstitutionalAI, 30000);
});