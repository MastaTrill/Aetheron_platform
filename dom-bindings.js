document.addEventListener('DOMContentLoaded', () => {
  const bind = (id, handler) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', (e) => {
      try {
        handler(e);
      } catch (err) {
        console.error('Handler error for', id, err);
      }
    });
  };

  // Modal accessibility helpers
  const FOCUSABLE_SELECTOR = [
    'a[href]','area[href]','button:not([disabled])','input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])','textarea:not([disabled])','iframe','object','embed',
    '[contenteditable]','[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const getFocusable = (container) => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);

  const trapFocus = (modalEl) => {
    const content = modalEl.querySelector('.modal-content') || modalEl;
    const focusables = getFocusable(content);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const handleKeydown = (e) => {
      if (e.key === 'Tab') {
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeAnyModal();
      }
    };

    modalEl.__a11yTrapHandler = handleKeydown;
    document.addEventListener('keydown', handleKeydown);

    // Move focus inside the modal, prefer close button if present
    const closeBtn = content.querySelector('.close-modal, [data-close], [aria-label="Close"]');
    (closeBtn || first || content).focus({ preventScroll: true });
  };

  const releaseTrap = (modalEl) => {
    const handler = modalEl.__a11yTrapHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
      delete modalEl.__a11yTrapHandler;
    }
  };

  const isVisible = (el) => !!el && (el.offsetParent !== null || getComputedStyle(el).position === 'fixed');

  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    // If project has dedicated open functions, prefer them
    if (modalId === 'qrModal' && typeof window.openQRModal === 'function') return window.openQRModal();
    if (modalId === 'shareModal' && typeof window.openShareModal === 'function') return window.openShareModal();

    modal.style.display = 'block';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    modal.classList.add('open');
    trapFocus(modal);
  };

  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    // If project has dedicated close functions, prefer them
    if (modalId === 'qrModal' && typeof window.closeQRModal === 'function') return window.closeQRModal();
    if (modalId === 'shareModal' && typeof window.closeShareModal === 'function') return window.closeShareModal();

    releaseTrap(modal);
    modal.classList.remove('open');
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
    modal.style.display = 'none';
  };

  const closeAnyModal = () => {
    const qr = document.getElementById('qrModal');
    const share = document.getElementById('shareModal');
    if (qr && isVisible(qr)) return closeModal('qrModal');
    if (share && isVisible(share)) return closeModal('shareModal');
  };

  onReady(() => {
    // Wallet actions
    bindClickById('refreshWalletBtn', () => { if (typeof window.recheckWallet === 'function') recheckWallet(); });
    bindClickById('disconnectBtn', () => { if (typeof window.disconnectWallet === 'function') disconnectWallet(); });

    // Quick actions
    bindClickById('buyAethBtn', () => {
      window.open('https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e','_blank');
    });
    bindClickById('addToWalletBtn', () => { if (typeof window.addTokenToWallet === 'function') addTokenToWallet(); });
    bindClickById('viewOnScanBtn', () => {
      window.open('https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e','_blank');
    });

    // Modal open buttons
    bindClickById('qrCodeBtn', () => openModal('qrModal'));
    bindClickById('shareBtn', () => openModal('shareModal'));

    // Modal close buttons
    bindClickById('closeQRModalBtn', () => closeModal('qrModal'));
    bindClickById('closeShareModalBtn', () => closeModal('shareModal'));

    // Share buttons
    bindClickById('shareTwitterBtn', () => { if (typeof window.shareTwitter === 'function') shareTwitter(); });
    bindClickById('shareFacebookBtn', () => { if (typeof window.shareFacebook === 'function') shareFacebook(); });
    bindClickById('shareTelegramBtn', () => { if (typeof window.shareTelegram === 'function') shareTelegram(); });
    bindClickById('shareLinkedInBtn', () => { if (typeof window.shareLinkedIn === 'function') shareLinkedIn(); });
    bindClickById('copyShareLinkBtn', () => { if (typeof window.copyShareLink === 'function') copyShareLink(); });

    // Copy address in QR modal
    bindClickById('copyContractAddressBtn', () => { if (typeof window.copyContractAddress === 'function') copyContractAddress(); });

    // Staking buttons
    for (let i = 0; i <= 2; i++) {
      bindClickById(`stakeBtn${i}`, () => { if (typeof window.stakeTokens === 'function') stakeTokens(i); });
    }

    // Calculator
    bindClickById('calcBtn', () => { if (typeof window.calculateRewards === 'function') calculateRewards(); });

    // Transactions
    bindClickById('refreshTxBtn', () => { if (typeof window.refreshTransactions === 'function') refreshTransactions(); });

    // Admin controls
    bindClickById('updateTaxesBtn', () => { if (typeof window.updateTaxes === 'function') updateTaxes(); });
    bindClickById('pauseTradingBtn', () => { if (typeof window.pauseTrading === 'function') pauseTrading(); });
    bindClickById('unpauseTradingBtn', () => { if (typeof window.unpauseTrading === 'function') unpauseTrading(); });
    bindClickById('withdrawTreasuryBtn', () => { if (typeof window.withdrawTreasury === 'function') withdrawTreasury(); });
    bindClickById('emergencyWithdrawBtn', () => { if (typeof window.emergencyWithdraw === 'function') emergencyWithdraw(); });
    bindClickById('rescueTokensBtn', () => { if (typeof window.rescueTokens === 'function') rescueTokens(); });

    // Global ESC handler to close any open modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAnyModal();
    });

    // Close modal when clicking backdrop (outside modal-content)
    ['qrModal', 'shareModal'].forEach((id) => {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.addEventListener('mousedown', (e) => {
        const content = modal.querySelector('.modal-content') || modal.firstElementChild;
        if (content && !content.contains(e.target)) closeModal(id);
      });
    });
  });
})();
