const HF_STATE={prices:[],times:[],max:60};
function hfNum(v,d=2){if(v===null||v===undefined||isNaN(v)) return '--';return Number(v).toLocaleString(undefined,{maximumFractionDigits:d});}
function hfMoney(v){if(v===null||v===undefined||isNaN(v)) return '--';return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:v<1?6:2}).format(v);}
function hfRead(id){const el=document.getElementById(id);if(!el) return NaN;return parseFloat(String(el.innerText).replace(/[^0-9.\-]/g,''));}
function hfMean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function hfStd(a){if(a.length<2) return 0;const m=hfMean(a);return Math.sqrt(hfMean(a.map(v=>(v-m)*(v-m))))}
function hfReturns(a){const out=[];for(let i=1;i<a.length;i++){if(a[i-1]>0) out.push((a[i]-a[i-1])/a[i-1]);}return out;}
let hfPerfChart,hfRiskChart;
function hfRenderCharts(){
 const perf=document.getElementById('hfPerfChart');
 const risk=document.getElementById('hfRiskChart');
 if(perf){if(hfPerfChart) hfPerfChart.destroy();hfPerfChart=new Chart(perf,{type:'line',data:{labels:HF_STATE.times,datasets:[{label:'Price',data:HF_STATE.prices,tension:.35,borderWidth:2,fill:false}]},options:{responsive:true,plugins:{legend:{display:false}}}})}
 const rets=hfReturns(HF_STATE.prices).map(r=>r*100);
 const vol=hfStd(rets);
 const dd=Math.max(0,...HF_STATE.prices)-Math.min(...HF_STATE.prices||[0]);
 if(risk){if(hfRiskChart) hfRiskChart.destroy();hfRiskChart=new Chart(risk,{type:'bar',data:{labels:['Volatility','Drawdown','Signal'],datasets:[{data:[vol,dd,(hfRead('hfSignalScore')||0)],borderWidth:1}]},options:{responsive:true,plugins:{legend:{display:false}}}})}
}
function hfCompute(){
 const price=hfRead('statPrice');
 const liq=hfRead('statLiquidity');
 const vol24=hfRead('statVolume');
 const change=hfRead('statChange');
 if(!isNaN(price)&&price>0){HF_STATE.prices.push(price);HF_STATE.times.push(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));if(HF_STATE.prices.length>HF_STATE.max){HF_STATE.prices.shift();HF_STATE.times.shift();}}
 const rets=hfReturns(HF_STATE.prices);
 const retsPct=rets.map(r=>r*100);
 const mean=hfMean(retsPct);
 const vol=hfStd(retsPct);
 const sharpe=vol?mean/vol*Math.sqrt(24):0;
 let peak=HF_STATE.prices[0]||0, maxDd=0;
 HF_STATE.prices.forEach(p=>{if(p>peak) peak=p; if(peak>0){const dd=(peak-p)/peak*100; if(dd>maxDd) maxDd=dd;}});
 const liqToVol=vol24>0?liq/vol24:0;
 const signal=Math.max(0,Math.min(100,Math.round((liqToVol*30)+(change*2)+(sharpe*18)-(maxDd*1.5))));
 const regime= change>2 && sharpe>0 ? 'Risk-on' : change<-2 ? 'Defensive' : 'Balanced';
 const recommendation = signal>70 ? 'Add exposure on pullbacks' : signal>45 ? 'Accumulate selectively' : 'Reduce beta / monitor';
 const turnover = liq>0 ? (vol24/liq)*100 : 0;
 const yieldAnnual = hfRead('rewardBal')*12;
 const ids={hfSharpe:sharpe,hfVol:vol,hfDrawdown:maxDd,hfLiqVol:liqToVol,hfTurnover:turnover,hfSignalScore:signal};
 Object.entries(ids).forEach(([id,val])=>{const el=document.getElementById(id); if(el) el.innerText=hfNum(val,2);});
 const setTxt=(id,val)=>{const el=document.getElementById(id); if(el) el.innerText=val;};
 setTxt('hfRegime',regime); setTxt('hfRecommendation',recommendation); setTxt('hfYieldAnnual',hfNum(yieldAnnual,2)); setTxt('hfAumView',hfMoney((hfRead('bal')||0)*price + (hfRead('stk')||0)*price)); setTxt('hfDeskNote',`Liquidity ${hfMoney(liq)} | 24h volume ${hfMoney(vol24)} | Price change ${hfNum(change,2)}%`);
 hfRenderCharts();
}
document.addEventListener('DOMContentLoaded',()=>{setTimeout(hfCompute,3000);setInterval(hfCompute,30000);});