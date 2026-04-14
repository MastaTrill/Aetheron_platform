import { renderConnectionStatus, renderSeedWords, renderTxHistory, renderActiveStakes } from './aetheron-wallet-safe-renderers.js';

function patchWalletRenderers(){
  const g = window;

  const originalUpdateConnectionStatus = g.updateConnectionStatus;
  g.updateConnectionStatus = function(status){
    const el = document.getElementById('connectionStatus');
    if (el) {
      renderConnectionStatus(el, status);
      return;
    }
    if (typeof originalUpdateConnectionStatus === 'function') {
      return originalUpdateConnectionStatus.call(this, status);
    }
  };

  const originalDisplayStoredSeed = g.displayStoredSeed;
  g.displayStoredSeed = function(){
    const display = document.getElementById('viewSeedPhrase');
    const words = Array.isArray(g.currentSeedPhrase) ? g.currentSeedPhrase : [];
    if (display && words.length) {
      renderSeedWords(display, words);
      return;
    }
    if (typeof originalDisplayStoredSeed === 'function') {
      return originalDisplayStoredSeed.call(this);
    }
  };

  const originalLoadTransactionHistory = g.loadTransactionHistory;
  g.loadTransactionHistory = async function(){
    const container = document.getElementById('txHistory');
    if (!container || !g.wallet || !g.aethContract || !g.ethers) {
      if (typeof originalLoadTransactionHistory === 'function') {
        return originalLoadTransactionHistory.call(this);
      }
      return;
    }
    try {
      const filter = g.aethContract.filters.Transfer(null, g.wallet.address);
      const received = await g.aethContract.queryFilter(filter, -10000);
      const sentFilter = g.aethContract.filters.Transfer(g.wallet.address, null);
      const sent = await g.aethContract.queryFilter(sentFilter, -10000);
      const allTxs = [...received.map((e) => ({ ...e, type: 'receive' })), ...sent.map((e) => ({ ...e, type: 'send' }))]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 10);
      renderTxHistory(container, allTxs, g.ethers);
    } catch (error) {
      console.error('Tx history error:', error);
      container.replaceChildren();
      const p = document.createElement('p');
      p.textContent = 'Error loading transactions';
      p.setAttribute('style', 'color: var(--text-muted); text-align: center; padding: 20px; font-size: 13px;');
      container.appendChild(p);
    }
  };

  const originalDisplayActiveStakes = g.displayActiveStakes;
  g.displayActiveStakes = function(stakes){
    const container = document.getElementById('activeStakes');
    if (container && g.POOL_INFO && g.ethers) {
      renderActiveStakes(container, stakes || [], g.POOL_INFO, g.ethers);
      container.querySelectorAll('[data-unstake-id]').forEach((btn)=>{
        btn.addEventListener('click', ()=>g.unstake?.(Number(btn.getAttribute('data-unstake-id'))));
      });
      container.querySelectorAll('[data-claim-id]').forEach((btn)=>{
        btn.addEventListener('click', ()=>g.claimStakeReward?.(Number(btn.getAttribute('data-claim-id'))));
      });
      return;
    }
    if (typeof originalDisplayActiveStakes === 'function') {
      return originalDisplayActiveStakes.call(this, stakes);
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchWalletRenderers);
} else {
  patchWalletRenderers();
}
