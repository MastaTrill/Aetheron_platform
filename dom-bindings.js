(function () {
  document.addEventListener('DOMContentLoaded', () => {
    import('./index-dom-overrides.js').catch((error) => {
      console.error('Failed to load index DOM overrides', error);
    });

    const bind = (id, handler) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', (event) => {
        try {
          handler(event);
        } catch (error) {
          console.error('Handler error for', id, error);
        }
      });
    };

    const invoke = (name, ...args) => {
      if (typeof window[name] === 'function') {
        window[name](...args);
      }
    };

    const FOCUSABLE_SELECTOR = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusable = (container) =>
      Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) =>
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el === document.activeElement,
      );

    const releaseTrap = (modalEl) => {
      const handler = modalEl.__a11yTrapHandler;
      if (handler) {
        document.removeEventListener('keydown', handler);
        delete modalEl.__a11yTrapHandler;
      }
    };

    const closeModal = (modalId) => {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      if (modalId === 'qrModal' && typeof window.closeQRModal === 'function') {
        window.closeQRModal();
        return;
      }

      if (
        modalId === 'shareModal' &&
        typeof window.closeShareModal === 'function'
      ) {
        window.closeShareModal();
        return;
      }

      releaseTrap(modal);
      modal.classList.remove('open');
      modal.removeAttribute('aria-modal');
      modal.removeAttribute('role');
      modal.style.display = 'none';
    };

    const closeAnyModal = () => {
      ['qrModal', 'shareModal'].forEach((id) => {
        const modal = document.getElementById(id);
        if (
          modal &&
          (modal.offsetParent !== null ||
            getComputedStyle(modal).position === 'fixed')
        ) {
          closeModal(id);
        }
      });
    };

    const trapFocus = (modalEl) => {
      const content = modalEl.querySelector('.modal-content') || modalEl;
      const focusables = getFocusable(content);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      const handleKeydown = (event) => {
        if (event.key === 'Tab') {
          if (focusables.length === 0) {
            event.preventDefault();
            return;
          }

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        } else if (event.key === 'Escape') {
          closeAnyModal();
        }
      };

      modalEl.__a11yTrapHandler = handleKeydown;
      document.addEventListener('keydown', handleKeydown);

      const closeBtn = content.querySelector(
        '.close-modal, [data-close], [aria-label="Close"]',
      );
      (closeBtn || first || content).focus({ preventScroll: true });
    };

    const openModal = (modalId) => {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      if (modalId === 'qrModal' && typeof window.openQRModal === 'function') {
        window.openQRModal();
        return;
      }

      if (
        modalId === 'shareModal' &&
        typeof window.openShareModal === 'function'
      ) {
        window.openShareModal();
        return;
      }

      modal.style.display = 'block';
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('role', 'dialog');
      modal.classList.add('open');
      trapFocus(modal);
    };

    bind('refreshWalletBtn', () => invoke('recheckWallet'));
    bind('disconnectBtn', () => invoke('disconnectWallet'));

    bind('buyAethBtn', () => {
      window.open(
        'https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
        '_blank',
      );
    });
    bind('addToWalletBtn', () => invoke('addTokenToWallet'));
    bind('viewOnScanBtn', () => {
      window.open(
        'https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
        '_blank',
      );
    });

    bind('qrCodeBtn', () => openModal('qrModal'));
    bind('shareBtn', () => openModal('shareModal'));
    bind('closeQRModalBtn', () => closeModal('qrModal'));
    bind('closeShareModalBtn', () => closeModal('shareModal'));

    bind('shareTwitterBtn', () => invoke('shareTwitter'));
    bind('shareFacebookBtn', () => invoke('shareFacebook'));
    bind('shareTelegramBtn', () => invoke('shareTelegram'));
    bind('shareLinkedInBtn', () => invoke('shareLinkedIn'));
    bind('copyShareLinkBtn', () => invoke('copyShareLink'));
    bind('copyContractAddressBtn', () => invoke('copyContractAddress'));

    for (let i = 0; i <= 2; i += 1) {
      bind(`stakeBtn${i}`, () => invoke('stakeTokens', i));
    }

    bind('calcBtn', () => invoke('calculateRewards'));
    bind('refreshTxBtn', () => invoke('refreshTransactions'));
    bind('updateTaxesBtn', () => invoke('updateTaxes'));
    bind('pauseTradingBtn', () => invoke('pauseTrading'));
    bind('unpauseTradingBtn', () => invoke('unpauseTrading'));
    bind('withdrawTreasuryBtn', () => invoke('withdrawTreasury'));
    bind('emergencyWithdrawBtn', () => invoke('emergencyWithdraw'));
    bind('rescueTokensBtn', () => invoke('rescueTokens'));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAnyModal();
      }
    });

    ['qrModal', 'shareModal'].forEach((id) => {
      const modal = document.getElementById(id);
      if (!modal) return;

      modal.addEventListener('mousedown', (event) => {
        const content =
          modal.querySelector('.modal-content') || modal.firstElementChild;
        if (content && !content.contains(event.target)) {
          closeModal(id);
        }
      });
    });
  });
})();
