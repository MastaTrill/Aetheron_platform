function copyTextToClipboard(text) {
  if (!text) {
    return Promise.resolve(false);
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.appendChild(input);

  if (typeof input.select === 'function') {
    input.select();
  } else {
    input.remove();
    return Promise.resolve(false);
  }

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  input.remove();
  return Promise.resolve(copied);
}

function showDashboardToast(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, { type });
    return;
  }

  if (type === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
}

function bindButtonOnce(id, handler) {
  const button = document.getElementById(id);
  if (!button || button.dataset.dashboardBound === 'true') {
    return button || null;
  }

  button.dataset.dashboardBound = 'true';
  button.addEventListener('click', handler);
  return button;
}

function setModalOpen(modal, isOpen) {
  if (!modal) {
    return;
  }

  modal.hidden = !isOpen;
  modal.classList.toggle('hidden', !isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function openSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    showDashboardToast('That section is not available right now.', 'warning');
    return;
  }

  if (typeof section.scrollIntoView === 'function') {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openExternalUrl(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener');
}

function getTrimmedText(id) {
  return document.getElementById(id)?.textContent?.trim() || '';
}

function getConnectedAccountValue() {
  const account = getTrimmedText('accountAddress');
  return account && account !== '-' ? account : '';
}

function syncReferralLink() {
  const referralInput = document.getElementById('referralLink');
  if (!referralInput) {
    return;
  }

  const account =
    getConnectedAccountValue() ||
    window.localStorage?.getItem('aetheron_connected') ||
    'YOURADDRESS';

  referralInput.value = `https://mastatrill.github.io/Aetheron_platform/?ref=${encodeURIComponent(account)}`;
}

function bindCopyResolverButton(id, resolveText, successMessage) {
  bindButtonOnce(id, async () => {
    const text = typeof resolveText === 'function' ? resolveText() : '';
    if (!text) {
      showDashboardToast('Nothing to copy yet.', 'warning');
      return;
    }

    const copied = await copyTextToClipboard(text);
    showDashboardToast(
      copied ? successMessage : 'Copy failed.',
      copied ? 'success' : 'error',
    );
  });
}

async function handleCopyButtonClick(event) {
  const button = event.currentTarget;
  const text = button?.dataset.copyText || '';
  const copied = await copyTextToClipboard(text);

  if (typeof window.showToast === 'function') {
    window.showToast(copied ? 'Copied to clipboard.' : 'Copy failed.', {
      type: copied ? 'success' : 'error',
    });
  }
}

function showWhitepaperSection(section) {
  const sections = ['summary', 'tokenomics', 'staking', 'security', 'roadmap'];

  sections.forEach((key) => {
    const panel = document.getElementById(`whitepaper-${key}`);
    if (!panel) {
      return;
    }

    panel.style.display = key === section ? '' : 'none';
  });
}

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.textContent = value;
}

function updateQuickStats() {
  const account =
    document.getElementById('accountAddress')?.textContent?.trim() || '-';
  const aeth =
    document.getElementById('aethBalance')?.textContent?.trim() || '-';
  const staked =
    document
      .getElementById('stakingHistoryTable')
      ?.querySelector('tbody tr:not(.text-gray) td:nth-child(3)')
      ?.textContent?.trim() || '0';
  const treasury =
    document.getElementById('treasuryTotal')?.textContent?.trim() || '-';
  const rewards =
    document.getElementById('stakingRewards')?.textContent?.trim() || '-';

  setTextContent('quickWallet', account);
  setTextContent('quickAeth', aeth);
  setTextContent('quickStaked', staked);
  setTextContent('quickTreasury', treasury);
  setTextContent('quickRewards', rewards);
}

function initQuickStats() {
  updateQuickStats();

  document
    .getElementById('refreshBalancesBtn')
    ?.addEventListener('click', () => setTimeout(updateQuickStats, 1000));
  document
    .getElementById('refreshTreasuryBtn')
    ?.addEventListener('click', () => setTimeout(updateQuickStats, 1000));

  window.addEventListener('aetheron:wallet-connected', updateQuickStats);
  window.addEventListener('aetheron:wallet-disconnected', updateQuickStats);
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy-text]').forEach((button) => {
    button.addEventListener('click', handleCopyButtonClick);
  });
}

function initWhitepaperButtons() {
  document.querySelectorAll('[data-whitepaper-section]').forEach((button) => {
    button.addEventListener('click', () => {
      if (typeof window.showWhitepaperSection === 'function') {
        window.showWhitepaperSection(button.dataset.whitepaperSection);
      }
    });
  });

  const downloadButton = document.getElementById('downloadWhitepaperBtn');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      window.open('WHITEPAPER.md', '_blank', 'noopener');
    });
  }

  const toggleBtn = document.getElementById('toggleWhitepaperBtn');
  const content = document.getElementById('whitepaperContent');

  if (toggleBtn && content) {
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      content.style.display = expanded ? 'none' : '';
      toggleBtn.textContent = expanded ? 'Expand' : 'Collapse';
      toggleBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  }

  showWhitepaperSection('summary');
}

function preventStakeFormSubmit() {
  const form = document.getElementById('stakeForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
}

function initSkipLink() {
  const skipLink = document.querySelector('.skip-link, .skip-to-content');
  if (!skipLink) {
    return;
  }

  skipLink.addEventListener('focus', () => {
    skipLink.style.left = '16px';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.left = '-999px';
  });
}

function initHelpCenter() {
  const tourBtn = document.getElementById('startTourBtn');
  if (
    tourBtn &&
    window.dashboard &&
    typeof window.dashboard.startTour === 'function'
  ) {
    tourBtn.addEventListener('click', () => {
      window.dashboard.startTour();
    });
  }

  const helpBtn = document.getElementById('openHelpCenterBtn');
  const helpModal = document.getElementById('helpCenterModal');
  const closeHelp = document.getElementById('closeHelpCenterModal');

  if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => {
      setModalOpen(helpModal, true);
    });
  }

  if (closeHelp && helpModal) {
    closeHelp.addEventListener('click', () => {
      setModalOpen(helpModal, false);
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === helpModal) {
      setModalOpen(helpModal, false);
    }
  });
}

function initProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) {
    return;
  }

  const closeBtn = modal.querySelector('.close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      setModalOpen(modal, false);
    });
  }

  const cancelBtn = document.getElementById('closeProfileModal');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      setModalOpen(modal, false);
    });
  }

  setModalOpen(modal, false);
}

function initOrphanedDashboardButtons() {
  const externalButtons = {
    openAggregatorBtn: 'https://app.1inch.io/',
    openSushiSwapDexBtn: 'https://www.sushi.com/swap',
    openSushiSwapMainBtn: 'https://www.sushi.com/swap',
    openSushiLiquidityBtn1: 'https://www.sushi.com/earn',
    openSushiLiquidityBtn: 'https://www.sushi.com/earn',
    openSushiWithdrawBtn: 'https://www.sushi.com/earn',
    openCurveSwapStableBtn: 'https://curve.fi/',
    openCurveSwapTokenBtn: 'https://curve.fi/',
    openCurveLiquidityBtn: 'https://curve.fi/',
    openCurveDepositBtn: 'https://curve.fi/',
    openCurveWithdrawStableBtn: 'https://curve.fi/',
    openCurveWithdrawTokenBtn: 'https://curve.fi/',
    openAaveLendBtn: 'https://app.aave.com/',
    openAaveBorrowBtn: 'https://app.aave.com/',
    openAaveRepayBtn: 'https://app.aave.com/',
    openCompoundSupplyBtn: 'https://app.compound.finance/',
    openCompoundBorrowBtn: 'https://app.compound.finance/',
    openCompoundRepayBtn: 'https://app.compound.finance/',
    openYearnDepositBtn: 'https://yearn.fi/',
    openYearnWithdrawBtn: 'https://yearn.fi/',
    openYearnViewYieldBtn: 'https://yearn.fi/',
    openMakerOpenVaultBtn: 'https://makerdao.com/',
    openMakerGenerateDaiBtn: 'https://makerdao.com/',
    openMakerRepayBtn: 'https://makerdao.com/',
    openDydxTradeBtn: 'https://www.dydx.xyz/',
    openDydxMarginBtn: 'https://www.dydx.xyz/',
    openDydxCollateralBtn: 'https://www.dydx.xyz/',
    openNftAggregatorBtn: 'https://opensea.io/',
  };

  Object.entries(externalButtons).forEach(([id, url]) => {
    bindButtonOnce(id, () => {
      openExternalUrl(url);
    });
  });

  bindCopyResolverButton(
    'copyAccountBtn',
    getConnectedAccountValue,
    'Account address copied.',
  );

  bindCopyResolverButton(
    'copyReferralBtn',
    () => {
      syncReferralLink();
      return document.getElementById('referralLink')?.value || '';
    },
    'Referral link copied.',
  );

  const profileModal = document.getElementById('profileModal');
  ['editProfileBtn1', 'editProfileBtn2'].forEach((id) => {
    bindButtonOnce(id, () => {
      setModalOpen(profileModal, true);
      document.getElementById('nicknameInput')?.focus();
    });
  });

  bindButtonOnce('openPortfolioBtn', () => openSection('wallet-portfolio-section'));
  bindButtonOnce('openSocialTradingBtn', () => openSection('leaderboard-section'));
  bindButtonOnce('openDaoBtn', () => openSection('governance-section'));
  bindButtonOnce('openLaunchpadBtn', () => {
    openSection('whitepaperCard');
    showDashboardToast('Launchpad details are listed in the roadmap section.', 'info');
  });
  bindButtonOnce('openWalletSecurityBtn', () => openSection('walletsecurity-section'));
  bindButtonOnce('openAlertsBtn', () => openSection('notifications-settings-section'));
  bindButtonOnce('viewNftsBtn', () => openSection('nft-gallery-section'));
  bindButtonOnce('mintNftBtn', () => {
    openExternalUrl('https://opensea.io/');
  });
  bindButtonOnce('transferNftBtn', () => {
    openSection('nft-gallery-section');
    showDashboardToast('Connect your wallet to transfer NFTs from your gallery.', 'info');
  });
  bindButtonOnce('listNftBtn', () => {
    openExternalUrl('https://opensea.io/');
  });
  bindButtonOnce('openFiatBtn', () => {
    const coinbaseButton = document.querySelector('.coinbase-btn');
    if (coinbaseButton instanceof HTMLElement) {
      coinbaseButton.click();
      return;
    }

    openExternalUrl('https://www.coinbase.com/');
  });
  bindButtonOnce('googleLoginBtn', () => {
    showDashboardToast(
      'Google sign-in is not configured on this static dashboard yet.',
      'info',
    );
  });

  syncReferralLink();
  window.addEventListener('aetheron:wallet-connected', syncReferralLink);
  window.addEventListener('aetheron:wallet-disconnected', syncReferralLink);
}

function initDashboardBodyActions() {
  window.showWhitepaperSection = showWhitepaperSection;
  window.copyTextToClipboard = copyTextToClipboard;
  window.updateQuickStats = updateQuickStats;
  initQuickStats();
  initCopyButtons();
  initWhitepaperButtons();
  preventStakeFormSubmit();
  initSkipLink();
  initHelpCenter();
  initProfileModal();
  initOrphanedDashboardButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardBodyActions, {
    once: true,
  });
} else {
  initDashboardBodyActions();
}
