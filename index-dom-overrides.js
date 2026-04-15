import { renderWalletStatus, renderTransactions, createIndexWalletChooserModal, renderUserStakes } from './index-safe-renderers.js';

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

  const originalEnsureWalletChooser = g.ensureWalletChooser;
  g.ensureWalletChooser = function () {
    let modal = document.getElementById('walletChooserModal');
    if (modal) {
      return modal;
    }

    modal = createIndexWalletChooserModal();
    document.body.appendChild(modal);

    const closeChooser = () => {
      modal.style.display = 'none';
      modal.classList.remove('show');
    };

    const closeButton = modal.querySelector('#walletChooserClose');
    if (closeButton) {
      closeButton.addEventListener('click', closeChooser);
      closeButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          closeChooser();
        }
      });
    }

    modal.addEventListener('mousedown', (event) => {
      const content = modal.querySelector('.modal-content');
      if (content && !content.contains(event.target)) {
        closeChooser();
      }
    });

    const metaMaskBtn = modal.querySelector('#walletChooserMetaMask');
    const coinbaseBtn = modal.querySelector('#walletChooserCoinbase');
    const browserBtn = modal.querySelector('#walletChooserBrowser');

    metaMaskBtn?.addEventListener('click', async () => {
      closeChooser();
      await g.connectWallet?.({ walletType: 'metamask' });
    });

    coinbaseBtn?.addEventListener('click', async () => {
      closeChooser();
      await g.connectWallet?.({ walletType: 'coinbase' });
    });

    browserBtn?.addEventListener('click', async () => {
      closeChooser();
      await g.connectWallet?.();
    });

    return modal;
  };

  const originalDisplayUserStakes = g.displayUserStakes;
  g.displayUserStakes = function (stakes) {
    let container = document.getElementById('userStakesContainer');
    if (!container) {
      const walletCard = document.querySelector('.card.mb-2');
      if (walletCard) {
        container = document.createElement('div');
        container.id = 'userStakesContainer';
        container.className = 'card mb-2';

        const header = document.createElement('div');
        header.className = 'card-header';
        const title = document.createElement('h2');
        title.className = 'card-title';
        title.textContent = 'Your Active Stakes';
        const button = document.createElement('button');
        button.className = 'btn btn-outline btn-sm';
        button.type = 'button';
        const icon = document.createElement('i');
        icon.className = 'fas fa-sync-alt';
        button.append(icon, document.createTextNode(' Refresh'));
        button.addEventListener('click', () => g.loadUserStakes?.());
        header.append(title, button);

        const list = document.createElement('div');
        list.className = 'user-stakes';
        list.id = 'userStakesList';

        container.append(header, list);
        walletCard.parentNode.insertBefore(container, walletCard.nextSibling);
      }
    }

    const list = document.getElementById('userStakesList');
    if (!list) {
      if (typeof originalDisplayUserStakes === 'function') {
        return originalDisplayUserStakes.call(this, stakes);
      }
      return;
    }

    renderUserStakes(list, Array.isArray(stakes) ? stakes : []);

    list.querySelectorAll('[data-claim-stake-id]').forEach((button) => {
      button.addEventListener('click', () => g.claimStakeRewards?.(Number(button.dataset.claimStakeId)));
    });

    list.querySelectorAll('[data-stake-action]').forEach((button) => {
      const stakeId = Number(button.dataset.stakeId);
      button.addEventListener('click', () => {
        if (button.dataset.stakeAction === 'unstake') {
          g.unstakeTokens?.(stakeId);
        } else {
          g.emergencyUnstake?.(stakeId);
        }
      });
    });
  };

  const originalShowQRCode = g.showQRCode;
  g.showQRCode = function () {
    const modal = document.getElementById('qrModal');
    const qrcodeContainer = document.getElementById('qrcode');
    if (!modal || !qrcodeContainer) {
      if (typeof originalShowQRCode === 'function') {
        return originalShowQRCode.call(this);
      }
      return;
    }

    qrcodeContainer.replaceChildren();
    new QRCode(qrcodeContainer, {
      text: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });

    modal.style.display = 'block';

    if (typeof g.gtag !== 'undefined') {
      g.gtag('event', 'show_qr_code', {
        event_category: 'engagement',
        event_label: 'contract_qr',
      });
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchIndexRenderers);
} else {
  patchIndexRenderers();
}
