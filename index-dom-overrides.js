import { renderWalletStatus, renderTransactions } from './index-safe-renderers.js';

function patchIndexRenderers() {
  const g = window;

  const originalCheckWalletStatus = g.checkWalletStatus;
  g.checkWalletStatus = async function () {
    const statusDiv = document.getElementById('walletStatus');
    if (!statusDiv) {
      console.warn('Wallet status element not found - page may not be fully loaded');
      return false;
    }

    const wallet = typeof g.resolveInjectedProvider === 'function' ? g.resolveInjectedProvider() : null;
    const walletName = typeof g.getWalletName === 'function' ? g.getWalletName(wallet) : '';

    if (wallet) {
      renderWalletStatus(statusDiv, 'detected', walletName);
      return true;
    }

    if (window.ethereum) {
      renderWalletStatus(statusDiv, 'other');
      return false;
    }

    renderWalletStatus(statusDiv, 'missing');
    return false;
  };

  const originalDisplayTransactions = g.displayTransactions;
  g.displayTransactions = function (transactions) {
    const list = document.getElementById('txList');
    const txEmpty = document.getElementById('txEmpty');
    if (!list || !txEmpty) {
      if (typeof originalDisplayTransactions === 'function') {
        return originalDisplayTransactions.call(this, transactions);
      }
      return;
    }

    if (!transactions || transactions.length === 0) {
      txEmpty.classList.remove('hidden');
      list.classList.add('hidden');
      list.replaceChildren();
      return;
    }

    txEmpty.classList.add('hidden');
    list.classList.remove('hidden');
    renderTransactions(list, transactions);
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchIndexRenderers);
} else {
  patchIndexRenderers();
}
