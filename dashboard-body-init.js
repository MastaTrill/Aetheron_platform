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

function initDashboardBodyActions() {
  initCopyButtons();
  initWhitepaperButtons();
  preventStakeFormSubmit();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardBodyActions, {
    once: true,
  });
} else {
  initDashboardBodyActions();
}
