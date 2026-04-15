import {
  createWalletChooserModal,
  renderWalletChooserOptions,
  createSimpleModal,
  renderTxHistoryTableBody,
  renderRewardList,
  renderAchievements,
  createTradeNotification,
} from './dashboard-safe-renderers.js';

function patchDashboardMain() {
  const g = window;

  const originalEnsureWalletChooser = g.ensureWalletChooser;
  g.ensureWalletChooser = function () {
    let modal = document.getElementById('walletChooserModal');
    if (modal) return modal;

    modal = createWalletChooserModal();
    document.body.appendChild(modal);

    const closeButton = document.getElementById('closeWalletChooserBtn');
    if (closeButton) {
      closeButton.addEventListener('click', g.closeWalletChooser);
    }

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        g.closeWalletChooser();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        g.closeWalletChooser();
      }
    });

    return modal;
  };

  const originalRenderWalletChooserOptions = g.renderWalletChooserOptions;
  g.renderWalletChooserOptions = function () {
    const optionsContainer = document.getElementById('walletChooserOptions');
    if (!optionsContainer) return;

    const injectedProviders = typeof g.getInjectedProviders === 'function' ? g.getInjectedProviders() : [];
    const chooserOptions = [];
    const seenChoices = new Set();

    injectedProviders.forEach((providerOption) => {
      const label = typeof g.getInjectedProviderLabel === 'function' ? g.getInjectedProviderLabel(providerOption) : 'Browser Wallet';
      const choice = label === 'MetaMask' ? 'metamask' : label === 'Coinbase Wallet' ? 'coinbase' : 'browser';
      if (seenChoices.has(choice)) return;
      seenChoices.add(choice);
      chooserOptions.push({
        choice,
        label,
        helper: label === 'MetaMask' ? 'Connect with MetaMask extension or mobile app' : `Connect with ${label}`,
      });
    });

    chooserOptions.push({
      choice: 'walletconnect',
      label: 'WalletConnect',
      helper: 'Scan with a mobile wallet',
    });

    if (chooserOptions.length === 1 && chooserOptions[0].choice === 'walletconnect') {
      chooserOptions.unshift(
        { choice: 'install-metamask', label: 'Get MetaMask', helper: 'Install the MetaMask browser extension' },
        { choice: 'install-coinbase', label: 'Get Coinbase Wallet', helper: 'Install the Coinbase Wallet extension' },
      );
    }

    renderWalletChooserOptions(optionsContainer, chooserOptions);

    optionsContainer.querySelectorAll('[data-wallet-choice]').forEach((button) => {
      button.addEventListener('click', async () => {
        const walletChoice = button.dataset.walletChoice;
        g.closeWalletChooser();

        if (walletChoice === 'walletconnect') {
          if (typeof g.connectWalletConnect === 'function') {
            await g.connectWalletConnect();
          } else {
            g.showToast?.('WalletConnect is still loading. Please try again.', { type: 'error' });
          }
          return;
        }

        if (walletChoice === 'install-metamask') {
          window.open('https://metamask.io/download/', '_blank', 'noopener');
          return;
        }

        if (walletChoice === 'install-coinbase') {
          window.open('https://www.coinbase.com/wallet/downloads', '_blank', 'noopener');
          return;
        }

        await g.connectWallet?.({ auto: false, walletType: walletChoice });
      });
    });
  };

  if (typeof originalEnsureWalletChooser !== 'function' || typeof originalRenderWalletChooserOptions !== 'function') {
    // no-op; the overrides above still provide the safer path if globals are used later
  }
}

function patchDashboardApp() {
  const dashboard = window.dashboard;
  if (!dashboard) return false;

  dashboard.renderTxHistory = function () {
    const tableBody = document.getElementById('txHistoryTable')?.querySelector('tbody');
    const type = document.getElementById('txTypeFilter')?.value || 'all';
    const date = document.getElementById('txDateFilter')?.value || '';
    if (!tableBody) return;

    let txs = this.getTxHistory();
    if (type !== 'all') txs = txs.filter((tx) => tx.type === type);
    if (date) txs = txs.filter((tx) => String(tx.date || '').startsWith(date));
    renderTxHistoryTableBody(tableBody, txs);
  };

  dashboard.updateTradingRewards = function () {
    const progressBar = document.getElementById('volume-progress');
    const progressText = document.getElementById('volume-text');
    const rewardsList = document.getElementById('trading-rewards');

    if (progressBar && progressText) {
      const progress = (this.tradingRewards.currentProgress / this.tradingRewards.dailyTarget) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressText.textContent = `$${this.tradingRewards.currentProgress.toFixed(0)} / $${this.tradingRewards.dailyTarget}`;
    }

    if (rewardsList) {
      renderRewardList(rewardsList, this.tradingRewards.rewards, this.tradingRewards.currentProgress);
    }
  };

  dashboard.updateAchievements = function () {
    const achievementsList = document.getElementById('achievements-list');
    if (achievementsList) {
      renderAchievements(achievementsList, this.achievements);
    }
  };

  dashboard.showTradeNotification = function (amount) {
    const notification = createTradeNotification(amount);
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  window.createDashboardModal = function (contentHtml) {
    if (typeof contentHtml !== 'string') {
      return createSimpleModal({ titleText: '', bodyNodes: [] });
    }

    if (contentHtml.includes('Edit Profile')) {
      const nameLabel = document.createElement('label');
      nameLabel.textContent = 'Name: ';
      const nameInput = document.createElement('input');
      nameInput.id = 'profileNameInput';
      nameInput.type = 'text';
      nameInput.value = 'Alex';
      nameLabel.appendChild(nameInput);

      const emailLabel = document.createElement('label');
      emailLabel.textContent = 'Email: ';
      const emailInput = document.createElement('input');
      emailInput.id = 'profileEmailInput';
      emailInput.type = 'email';
      emailInput.value = 'alex@email.com';
      emailLabel.appendChild(emailInput);

      const br1 = document.createElement('br');
      const br2 = document.createElement('br');

      const save = document.createElement('button');
      save.id = 'saveProfileBtn';
      save.type = 'button';
      save.textContent = 'Save';

      const close = document.createElement('button');
      close.id = 'closeProfileModalBtn';
      close.type = 'button';
      close.textContent = 'Close';

      const modal = createSimpleModal({
        titleText: 'Edit Profile',
        bodyNodes: [nameLabel, br1, emailLabel, br2],
        actionButtons: [save, close],
      });
      document.body.appendChild(modal);
      return modal;
    }

    if (contentHtml.includes('Welcome to Aetheron!')) {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Your browser can open the onboarding walkthrough when the video asset is available.';
      const close = document.createElement('button');
      close.id = 'closeVideoModalBtn';
      close.type = 'button';
      close.textContent = 'Close';
      const modal = createSimpleModal({ titleText: 'Welcome to Aetheron!', bodyNodes: [paragraph], actionButtons: [close] });
      document.body.appendChild(modal);
      return modal;
    }

    if (contentHtml.includes('Gamified Tutorial')) {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Complete tasks to earn badges and rewards!';
      const list = document.createElement('ul');
      ['Connect your wallet ❌', 'Make your first trade ❌', 'Vote in governance ❌'].forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
      const close = document.createElement('button');
      close.id = 'closeTutorialModalBtn';
      close.type = 'button';
      close.textContent = 'Close';
      const modal = createSimpleModal({ titleText: 'Gamified Tutorial', bodyNodes: [paragraph, list], actionButtons: [close] });
      document.body.appendChild(modal);
      return modal;
    }

    const fallbackText = document.createElement('p');
    fallbackText.textContent = 'Modal content is available.';
    const modal = createSimpleModal({ titleText: 'Aetheron Modal', bodyNodes: [fallbackText] });
    document.body.appendChild(modal);
    return modal;
  };

  return true;
}

function initPatches() {
  patchDashboardMain();
  if (!patchDashboardApp()) {
    const retry = () => {
      if (patchDashboardApp()) return;
      setTimeout(retry, 250);
    };
    retry();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPatches);
} else {
  initPatches();
}
