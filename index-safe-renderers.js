import { clear, el, button, append } from './safe-dom.js';

export function renderWalletStatus(statusDiv, { state, walletName = '' }) {
  if (!statusDiv) return;
  clear(statusDiv);
  if (state === 'detected') {
    append(statusDiv,
      el('i', { className: 'fas fa-check-circle', attrs: { style: 'color: var(--success);' } }),
      document.createTextNode(` ${walletName} Detected ✓`),
      el('br'),
      el('small', { text: 'Ready to connect', attrs: { style: 'color: #6b7280;' } })
    );
    statusDiv.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
    statusDiv.style.border = '2px solid var(--success)';
    return;
  }
  if (state === 'other-wallet') {
    append(statusDiv,
      el('i', { className: 'fas fa-exclamation-triangle', attrs: { style: 'color: var(--warning);' } }),
      document.createTextNode(' Other wallet detected'),
      el('br'),
      el('small', { text: 'Coinbase Wallet or MetaMask not found', attrs: { style: 'color: #6b7280;' } })
    );
    statusDiv.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))';
    statusDiv.style.border = '2px solid var(--warning)';
    return;
  }
  append(statusDiv,
    el('i', { className: 'fas fa-times-circle', attrs: { style: 'color: var(--danger);' } }),
    document.createTextNode(' Wallet Not Detected'),
    el('br'),
    el('small', { text: 'Install Coinbase Wallet or MetaMask and refresh page', attrs: { style: 'color: #6b7280;' } })
  );
  statusDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))';
  statusDiv.style.border = '2px solid var(--danger)';
}

export function renderTransactions(list, txEmpty, transactions) {
  if (!list || !txEmpty) return;
  clear(list);
  if (!transactions || transactions.length === 0) {
    txEmpty.classList.remove('hidden');
    list.classList.add('hidden');
    return;
  }
  txEmpty.classList.add('hidden');
  list.classList.remove('hidden');
  transactions.forEach((tx) => {
    const item = el('div', { className: 'tx-item' });
    const left = el('div');
    const type = el('span', { className: `tx-type ${tx.type}`, text: tx.type === 'send' ? 'Sent' : 'Received' });
    const time = el('div', { className: 'text-sm text-gray mt-05', text: tx.timestamp.toLocaleString() });
    append(left, type, time);
    const right = el('div', { attrs: { style: 'text-align: right;' } });
    const amount = el('div', { className: 'fw-600', text: `${parseFloat(tx.value).toFixed(4)} AETH` });
    const link = el('a', { className: 'text-sm', text: 'View', attrs: { href: `https://polygonscan.com/tx/${tx.hash}`, target: '_blank', rel: 'noopener', style: 'color: var(--primary);' } });
    append(link, document.createTextNode(' '), el('i', { className: 'fas fa-external-link-alt' }));
    append(right, amount, link);
    append(item, left, right);
    list.appendChild(item);
  });
}

export function renderUserStakes(list, stakes, { onRefresh, onClaim, onUnstake, onEmergencyUnstake }) {
  if (!list) return;
  clear(list);
  if (!stakes || stakes.length === 0) {
    const empty = el('div', { className: 'wallet-section' });
    append(empty,
      el('i', { className: 'fas fa-inbox empty-icon' }),
      el('p', { className: 'text-gray', text: 'No active stakes yet. Start staking to earn rewards!' })
    );
    list.appendChild(empty);
    return;
  }
  const poolNames = ['30 Days (5% APY)', '90 Days (12% APY)', '180 Days (25% APY)'];
  stakes.forEach((stake) => {
    const isUnlocked = new Date() >= stake.unlockTime;
    const status = isUnlocked ? 'completed' : 'active';
    const statusText = isUnlocked ? 'Unlocked' : 'Locked';
    const item = el('div', { className: 'stake-item slide-up' });
    const header = el('div', { className: 'stake-header' });
    const headerLeft = el('div');
    append(headerLeft,
      el('div', { className: 'fw-600', text: poolNames[stake.poolId] || 'Unknown Pool' }),
      el('div', { className: 'text-sm text-gray', text: `Stake #${stake.id}` })
    );
    const badge = el('span', { className: `stake-badge ${status}`, text: statusText });
    append(header, headerLeft, badge);
    const details = el('div', { className: 'stake-details' });
    const fields = [
      ['Staked Amount', `${parseFloat(stake.amount).toFixed(2)} AETH`],
      ['Pending Rewards', `${parseFloat(stake.pendingReward).toFixed(4)} AETH`],
      ['Started', stake.startTime.toLocaleDateString()],
      ['Unlock Date', stake.unlockTime.toLocaleDateString()]
    ];
    fields.forEach(([label, value]) => {
      const row = el('div', { className: 'stake-detail-item' });
      append(row,
        el('span', { className: 'stake-detail-label', text: label }),
        el('span', { className: 'stake-detail-value', text: value })
      );
      details.appendChild(row);
    });
    const actions = el('div', { className: 'stake-actions' });
    if (parseFloat(stake.pendingReward) > 0) {
      const claimBtn = button('Claim Rewards', { className: 'btn btn-success btn-sm' });
      append(claimBtn, document.createTextNode(' '));
      claimBtn.prepend(el('i', { className: 'fas fa-coins' }));
      if (!isUnlocked) claimBtn.disabled = true;
      claimBtn.addEventListener('click', () => onClaim?.(stake.id));
      actions.appendChild(claimBtn);
    }
    const actionBtn = button(isUnlocked ? 'Unstake' : 'Emergency Withdraw', { className: isUnlocked ? 'btn btn-primary btn-sm' : 'btn btn-warning btn-sm' });
    actionBtn.prepend(el('i', { className: isUnlocked ? 'fas fa-unlock' : 'fas fa-exclamation-triangle' }));
    actionBtn.append(document.createTextNode(' '));
    actionBtn.addEventListener('click', () => (isUnlocked ? onUnstake : onEmergencyUnstake)?.(stake.id));
    actions.appendChild(actionBtn);
    append(item, header, details, actions);
    list.appendChild(item);
  });
}

export function renderWalletChooser(modal, { onMetaMask, onCoinbase, onBrowser, onClose, providers }) {
  if (!modal) return;
  clear(modal);
  modal.className = 'modal';
  modal.style.display = 'none';
  const content = el('div', { className: 'modal-content', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'walletChooserTitle' } });
  const close = el('span', { className: 'close-modal', text: '×', attrs: { id: 'walletChooserClose', role: 'button', tabindex: '0', 'aria-label': 'Close wallet chooser' } });
  const title = el('h2', { text: 'Choose Wallet', attrs: { id: 'walletChooserTitle' } });
  const desc = el('p', { className: 'text-gray paragraph-spacing', text: 'Select the wallet you want to connect on this device.' });
  const actions = el('div', { className: 'quick-actions', attrs: { style: 'margin-top:1rem;' } });
  const mm = button(' MetaMask', { className: 'quick-action-btn' });
  mm.prepend(el('i', { className: 'fas fa-wallet' }));
  const cb = button(' Coinbase Wallet', { className: 'quick-action-btn' });
  cb.prepend(el('i', { className: 'fas fa-wallet' }));
  const bw = button(' Browser Wallet', { className: 'quick-action-btn' });
  bw.prepend(el('i', { className: 'fas fa-plug' }));
  mm.style.display = providers?.some((p) => p?.isMetaMask) ? '' : 'none';
  cb.style.display = providers?.some((p) => p?.isCoinbaseWallet) ? '' : 'none';
  mm.addEventListener('click', onMetaMask || (() => {}));
  cb.addEventListener('click', onCoinbase || (() => {}));
  bw.addEventListener('click', onBrowser || (() => {}));
  close.addEventListener('click', onClose || (() => {}));
  append(actions, mm, cb, bw);
  append(content, close, title, desc, actions);
  modal.appendChild(content);
}
