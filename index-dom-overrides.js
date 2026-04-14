import { renderWalletStatus, renderTransactions, renderUserStakes, renderWalletChooser } from './index-safe-renderers.js';

function patchIndexRenderers() {
  const g = window;

  g.__aetheronRenderWalletStatus = function(statusDiv, state, walletName = '') {
    renderWalletStatus(statusDiv, { state, walletName });
  };

  const originalCheckWalletStatus = g.checkWalletStatus;
  if (typeof originalCheckWalletStatus === 'function') {
    g.checkWalletStatus = async function patchedCheckWalletStatus(...args) {
      const statusDiv = document.getElementById('walletStatus');
      const wallet = typeof g.resolveInjectedProvider === 'function' ? g.resolveInjectedProvider() : null;
      const walletName = typeof g.getWalletName === 'function' ? g.getWalletName(wallet) : '';
      if (wallet && statusDiv) {
        renderWalletStatus(statusDiv, { state: 'detected', walletName });
        return true;
      }
      if (g.ethereum && statusDiv) {
        renderWalletStatus(statusDiv, { state: 'other-wallet' });
        return false;
      }
      if (statusDiv) {
        renderWalletStatus(statusDiv, { state: 'missing' });
      }
      return originalCheckWalletStatus.apply(this, args);
    };
  }

  const originalDisplayTransactions = g.displayTransactions;
  g.displayTransactions = function patchedDisplayTransactions(transactions) {
    const list = document.getElementById('txList');
    const txEmpty = document.getElementById('txEmpty');
    if (list && txEmpty) {
      renderTransactions(list, txEmpty, transactions || []);
      return;
    }
    if (typeof originalDisplayTransactions === 'function') {
      return originalDisplayTransactions.call(this, transactions);
    }
  };

  const originalDisplayUserStakes = g.displayUserStakes;
  g.displayUserStakes = function patchedDisplayUserStakes(stakes) {
    let container = document.getElementById('userStakesContainer');
    if (!container) {
      const walletCard = document.querySelector('.card.mb-2');
      if (walletCard) {
        container = document.createElement('div');
        container.id = 'userStakesContainer';
        container.className = 'card mb-2';
        container.innerHTML = '<div class="card-header"><h2 class="card-title">Your Active Stakes</h2><button class="btn btn-outline btn-sm" id="refreshUserStakesBtn" type="button"><i class="fas fa-sync-alt"></i> Refresh</button></div><div class="user-stakes" id="userStakesList"></div>';
        walletCard.parentNode.insertBefore(container, walletCard.nextSibling);
        container.querySelector('#refreshUserStakesBtn')?.addEventListener('click', () => g.loadUserStakes?.());
      }
    }
    const list = document.getElementById('userStakesList');
    if (list) {
      renderUserStakes(list, stakes || [], {
        onRefresh: () => g.loadUserStakes?.(),
        onClaim: (id) => g.claimStakeRewards?.(id),
        onUnstake: (id) => g.unstakeTokens?.(id),
        onEmergencyUnstake: (id) => g.emergencyUnstake?.(id)
      });
      return;
    }
    if (typeof originalDisplayUserStakes === 'function') {
      return originalDisplayUserStakes.call(this, stakes);
    }
  };

  const originalEnsureWalletChooser = g.ensureWalletChooser;
  g.ensureWalletChooser = function patchedEnsureWalletChooser() {
    let modal = document.getElementById('walletChooserModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'walletChooserModal';
      document.body.appendChild(modal);
    }
    const providers = typeof g.getInjectedProviders === 'function' ? g.getInjectedProviders() : [];
    const closeChooser = () => {
      modal.style.display = 'none';
      modal.classList.remove('show');
    };
    renderWalletChooser(modal, {
      providers,
      onClose: closeChooser,
      onMetaMask: async () => { closeChooser(); await g.connectWallet?.({ walletType: 'metamask' }); },
      onCoinbase: async () => { closeChooser(); await g.connectWallet?.({ walletType: 'coinbase' }); },
      onBrowser: async () => { closeChooser(); await g.connectWallet?.(); }
    });
    modal.addEventListener('mousedown', (event) => {
      const content = modal.querySelector('.modal-content');
      if (content && !content.contains(event.target)) closeChooser();
    }, { once: true });
    return modal;
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchIndexRenderers);
} else {
  patchIndexRenderers();
}
