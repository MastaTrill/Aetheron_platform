export function clearNode(node) {
  if (!node) return;
  node.replaceChildren();
}

export function renderWalletStatus(container, variant, walletName = '') {
  clearNode(container);

  const icon = document.createElement('i');
  const detail = document.createElement('small');
  detail.style.color = '#6b7280';

  if (variant === 'detected') {
    icon.className = 'fas fa-check-circle';
    icon.style.color = 'var(--success)';
    container.append(icon, document.createTextNode(` ${walletName} Detected ✓`), document.createElement('br'));
    detail.textContent = 'Ready to connect';
    container.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
    container.style.border = '2px solid var(--success)';
  } else if (variant === 'other') {
    icon.className = 'fas fa-exclamation-triangle';
    icon.style.color = 'var(--warning)';
    container.append(icon, document.createTextNode(' Other wallet detected'), document.createElement('br'));
    detail.textContent = 'Coinbase Wallet or MetaMask not found';
    container.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))';
    container.style.border = '2px solid var(--warning)';
  } else if (variant === 'checking') {
    icon.className = 'fas fa-spinner fa-spin';
    container.append(icon, document.createTextNode(' Checking for wallet...'));
    detail.textContent = '';
  } else {
    icon.className = 'fas fa-times-circle';
    icon.style.color = 'var(--danger)';
    container.append(icon, document.createTextNode(' Wallet Not Detected'), document.createElement('br'));
    detail.textContent = 'Install Coinbase Wallet or MetaMask and refresh page';
    container.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))';
    container.style.border = '2px solid var(--danger)';
  }

  if (detail.textContent) {
    container.appendChild(detail);
  }
}

export function renderTransactions(list, transactions) {
  clearNode(list);

  for (const tx of transactions) {
    const row = document.createElement('div');
    row.className = 'tx-item';

    const left = document.createElement('div');
    const type = document.createElement('span');
    type.className = `tx-type ${tx.type}`;
    type.textContent = tx.type === 'send' ? 'Sent' : 'Received';
    const time = document.createElement('div');
    time.className = 'text-sm text-gray mt-05';
    time.textContent = tx.timestamp instanceof Date ? tx.timestamp.toLocaleString() : String(tx.timestamp || '');
    left.append(type, time);

    const right = document.createElement('div');
    right.style.textAlign = 'right';
    const amount = document.createElement('div');
    amount.className = 'fw-600';
    amount.textContent = `${Number.parseFloat(tx.value || 0).toFixed(4)} AETH`;
    const link = document.createElement('a');
    link.href = `https://polygonscan.com/tx/${tx.hash}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'text-sm';
    link.style.color = 'var(--primary)';
    link.textContent = 'View';
    const icon = document.createElement('i');
    icon.className = 'fas fa-external-link-alt';
    link.append(' ', icon);
    right.append(amount, link);

    row.append(left, right);
    list.appendChild(row);
  }
}

export function createIndexWalletChooserModal() {
  const modal = document.createElement('div');
  modal.id = 'walletChooserModal';
  modal.className = 'modal';
  modal.style.display = 'none';

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'true');
  content.setAttribute('aria-labelledby', 'walletChooserTitle');

  const close = document.createElement('span');
  close.id = 'walletChooserClose';
  close.className = 'close-modal';
  close.setAttribute('role', 'button');
  close.setAttribute('tabindex', '0');
  close.setAttribute('aria-label', 'Close wallet chooser');
  close.textContent = '×';

  const title = document.createElement('h2');
  title.id = 'walletChooserTitle';
  title.textContent = 'Choose Wallet';

  const paragraph = document.createElement('p');
  paragraph.className = 'text-gray paragraph-spacing';
  paragraph.textContent = 'Select the wallet you want to connect on this device.';

  const actions = document.createElement('div');
  actions.className = 'quick-actions';
  actions.style.marginTop = '1rem';

  const choices = [
    ['walletChooserMetaMask', 'fas fa-wallet', 'MetaMask'],
    ['walletChooserCoinbase', 'fas fa-wallet', 'Coinbase Wallet'],
    ['walletChooserBrowser', 'fas fa-plug', 'Browser Wallet'],
  ];

  for (const [id, iconClass, label] of choices) {
    const button = document.createElement('button');
    button.id = id;
    button.className = 'quick-action-btn';
    button.type = 'button';
    const icon = document.createElement('i');
    icon.className = iconClass;
    button.append(icon, document.createTextNode(` ${label}`));
    actions.appendChild(button);
  }

  content.append(close, title, paragraph, actions);
  modal.appendChild(content);
  return modal;
}

export function renderUserStakes(list, stakes) {
  clearNode(list);

  if (!stakes.length) {
    const empty = document.createElement('div');
    empty.className = 'wallet-section';
    const icon = document.createElement('i');
    icon.className = 'fas fa-inbox empty-icon';
    const text = document.createElement('p');
    text.className = 'text-gray';
    text.textContent = 'No active stakes yet. Start staking to earn rewards!';
    empty.append(icon, text);
    list.appendChild(empty);
    return;
  }

  const poolNames = ['30 Days (5% APY)', '90 Days (12% APY)', '180 Days (25% APY)'];

  for (const stake of stakes) {
    const item = document.createElement('div');
    item.className = 'stake-item slide-up';

    const header = document.createElement('div');
    header.className = 'stake-header';
    const headerLeft = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'fw-600';
    title.textContent = poolNames[stake.poolId] || 'Unknown Pool';
    const subtitle = document.createElement('div');
    subtitle.className = 'text-sm text-gray';
    subtitle.textContent = `Stake #${stake.id}`;
    headerLeft.append(title, subtitle);
    const badge = document.createElement('span');
    const isUnlocked = new Date() >= stake.unlockTime;
    badge.className = `stake-badge ${isUnlocked ? 'completed' : 'active'}`;
    badge.textContent = isUnlocked ? 'Unlocked' : 'Locked';
    header.append(headerLeft, badge);

    const details = document.createElement('div');
    details.className = 'stake-details';
    const detailItems = [
      ['Staked Amount', `${Number.parseFloat(stake.amount).toFixed(2)} AETH`],
      ['Pending Rewards', `${Number.parseFloat(stake.pendingReward).toFixed(4)} AETH`],
      ['Started', stake.startTime.toLocaleDateString()],
      ['Unlock Date', stake.unlockTime.toLocaleDateString()],
    ];
    for (const [label, value] of detailItems) {
      const detail = document.createElement('div');
      detail.className = 'stake-detail-item';
      const detailLabel = document.createElement('span');
      detailLabel.className = 'stake-detail-label';
      detailLabel.textContent = label;
      const detailValue = document.createElement('span');
      detailValue.className = 'stake-detail-value';
      detailValue.textContent = value;
      detail.append(detailLabel, detailValue);
      details.appendChild(detail);
    }

    const actions = document.createElement('div');
    actions.className = 'stake-actions';
    if (Number.parseFloat(stake.pendingReward) > 0) {
      const claim = document.createElement('button');
      claim.className = 'btn btn-success btn-sm';
      claim.type = 'button';
      claim.disabled = !isUnlocked;
      claim.dataset.claimStakeId = String(stake.id);
      const icon = document.createElement('i');
      icon.className = 'fas fa-coins';
      claim.append(icon, document.createTextNode(' Claim Rewards'));
      actions.appendChild(claim);
    }
    const actionBtn = document.createElement('button');
    actionBtn.className = `btn ${isUnlocked ? 'btn-primary' : 'btn-warning'} btn-sm`;
    actionBtn.type = 'button';
    actionBtn.dataset.stakeAction = isUnlocked ? 'unstake' : 'emergency';
    actionBtn.dataset.stakeId = String(stake.id);
    const actionIcon = document.createElement('i');
    actionIcon.className = isUnlocked ? 'fas fa-unlock' : 'fas fa-exclamation-triangle';
    actionBtn.append(actionIcon, document.createTextNode(isUnlocked ? ' Unstake' : ' Emergency Withdraw'));
    actions.appendChild(actionBtn);

    item.append(header, details, actions);
    list.appendChild(item);
  }
}

export function renderSearchResults(container, results) {
  clearNode(container);

  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'search-result-item';
    empty.textContent = 'No results found';
    container.appendChild(empty);
    return;
  }

  for (const result of results) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.dataset.title = result.title;

    const strong = document.createElement('strong');
    strong.textContent = result.title;
    const small = document.createElement('small');
    small.style.color = 'var(--text-muted)';
    small.textContent = result.type;

    item.append(strong, document.createTextNode(' '), small);
    container.appendChild(item);
  }
}

export function renderActivityRows(tbody, rows, selectedItems) {
  clearNode(tbody);

  for (const item of rows) {
    const tr = document.createElement('tr');

    const checkboxTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.user = item.user;
    checkbox.checked = selectedItems.has(item.user);
    checkboxTd.appendChild(checkbox);

    const userTd = document.createElement('td');
    userTd.textContent = item.user;
    const actionTd = document.createElement('td');
    actionTd.textContent = item.action;
    const statusTd = document.createElement('td');
    const statusSpan = document.createElement('span');
    statusSpan.className = `table-status-${item.status}`;
    statusSpan.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    statusTd.appendChild(statusSpan);
    const timeTd = document.createElement('td');
    timeTd.textContent = item.time;
    const viewTd = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'btn btn-secondary btn-sm';
    button.type = 'button';
    button.textContent = 'View';
    button.dataset.user = item.user;
    viewTd.appendChild(button);

    tr.append(checkboxTd, userTd, actionTd, statusTd, timeTd, viewTd);
    tbody.appendChild(tr);
  }
}

export function renderNotification(container, title, message, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const header = document.createElement('div');
  header.className = 'notification-header';
  const titleDiv = document.createElement('div');
  titleDiv.className = 'notification-title';
  titleDiv.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'notification-close';
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  header.append(titleDiv, closeBtn);

  const body = document.createElement('div');
  body.className = 'notification-message';
  body.textContent = message;

  notification.append(header, body);
  container.appendChild(notification);
  return { notification, closeBtn };
}
