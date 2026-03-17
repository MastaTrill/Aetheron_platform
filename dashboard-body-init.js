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
  input.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  input.remove();
  return Promise.resolve(copied);
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
  const skipLink = document.querySelector('.skip-link');
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
      helpModal.style.display = 'block';
    });
  }

  if (closeHelp && helpModal) {
    closeHelp.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === helpModal) {
      helpModal.style.display = 'none';
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
      modal.hidden = true;
    });
  }

  const cancelBtn = document.getElementById('closeProfileModal');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.hidden = true;
    });
  }
}

function initDashboardBodyActions() {
  window.showWhitepaperSection = showWhitepaperSection;
  window.updateQuickStats = updateQuickStats;
  initQuickStats();
  initCopyButtons();
  initWhitepaperButtons();
  preventStakeFormSubmit();
  initSkipLink();
  initHelpCenter();
  initProfileModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardBodyActions, {
    once: true,
  });
} else {
  initDashboardBodyActions();
}
