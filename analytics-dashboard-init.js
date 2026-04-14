// Analytics Dashboard initialization extracted from inline script for CSP compliance
(function(){
  'use strict';

  function el(tag,{className,text,attrs}={}){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);if(attrs)Object.entries(attrs).forEach(([k,v])=>{if(v!==undefined&&v!==null)n.setAttribute(k,String(v));});return n;}
  function clear(node){if(node)node.replaceChildren();}

  async function updateKeyMetrics() {
    try {
      const r = await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D');
      const data = await r.json();
      if (data.pair) {
        const price = parseFloat(data.pair.priceUsd) || 0;
        const change24h = parseFloat(data.pair.priceChange?.h24) || 0;
        const vol24h = parseFloat(data.pair.volume?.h24) || 0;
        const tvl = parseFloat(data.pair.liquidity?.usd) || 0;

        const priceEl = document.getElementById('current-price');
        const priceChangeEl = document.getElementById('price-change');
        const volEl = document.getElementById('volume-24h');
        const tvlEl = document.getElementById('tvl-value');
        if (priceEl) priceEl.textContent = '$' + price.toFixed(6);
        if (priceChangeEl) {
          priceChangeEl.textContent = (change24h >= 0 ? '▲ ' : '▼ ') + Math.abs(change24h).toFixed(2) + '%';
          priceChangeEl.className = 'stat-change ' + (change24h >= 0 ? 'positive' : 'negative');
        }
        if (volEl) volEl.textContent = '$' + vol24h.toFixed(2);
        if (tvlEl) tvlEl.textContent = '$' + tvl.toFixed(2);
      }

      if (window.readOnlyAethContract && window.readOnlyStakingContract && window.ethers) {
        const totalSupply = await window.readOnlyAethContract.totalSupply();
        const totalStaked = await window.readOnlyStakingContract.totalStaked();
        const rewardBal = await window.readOnlyAethContract.balanceOf(window.STAKING_ADDRESS);

        const staked = parseFloat(ethers.utils.formatEther(totalStaked));
        const rewards = parseFloat(ethers.utils.formatEther(rewardBal));
        const supply = parseFloat(ethers.utils.formatEther(totalSupply));
        const stakedPct = (staked / supply) * 100;

        const stakedEl = document.getElementById('staked-value');
        const stakedPctEl = document.getElementById('staked-percent');
        const rewardPoolEl = document.getElementById('reward-pool');
        if (stakedEl) stakedEl.textContent = staked.toFixed(0).toLocaleString() + ' AETH';
        if (stakedPctEl) stakedPctEl.textContent = stakedPct.toFixed(2) + '% of supply';
        if (rewardPoolEl) rewardPoolEl.textContent = rewards.toFixed(0).toLocaleString() + ' AETH';

        try {
          const poolCount = await window.readOnlyStakingContract.getPoolCount();
          const stakersCountEl = document.getElementById('stakers-count');
          if (stakersCountEl) stakersCountEl.textContent = poolCount.toString();
        } catch (_) {
          const stakersCountEl = document.getElementById('stakers-count');
          if (stakersCountEl) stakersCountEl.textContent = '3 Pools';
        }
      }

      generateInsights();
    } catch (err) {
      console.error('❌ Error updating key metrics:', err);
    }
  }

  function generateInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;
    const items = [
      { title: '📈 Price Performance', text: 'AETH is actively trading on QuickSwap V2. Price updates every 30 seconds from live DEX data.' },
      { title: '🎯 Staking Participation', text: 'Three staking pools are available with APYs ranging from 8% to 18%. Lock periods vary from 7 to 90 days.' },
      { title: '💰 Liquidity Status', text: 'Current liquidity pool contains AETH/POL on QuickSwap. Consider adding more liquidity for better price stability.' },
      { title: '🚀 Growth Opportunity', text: 'Platform is technically complete with verified contracts. Ready for marketing and user acquisition campaigns.' }
    ];
    clear(container);
    items.forEach((item)=>{
      const node=el('div',{className:'insight-item'});
      node.append(el('h4',{text:item.title}),el('p',{text:item.text}));
      container.appendChild(node);
    });
  }

  console.log('📊 Analytics dashboard initializing...');
  setTimeout(() => { updateKeyMetrics(); setInterval(updateKeyMetrics, 30000); }, 2000);
  console.log('✅ Analytics dashboard ready');
})();
