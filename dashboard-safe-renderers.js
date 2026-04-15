export function clearNode(node) {
  if (!node) return;
  node.replaceChildren();
}

export function createWalletChooserModal() {
  const modal = document.createElement('div');
  modal.id = 'walletChooserModal';
  modal.className = 'modal-bg';
  modal.hidden = true;

  const dialog = document.createElement('div');
  dialog.className = 'modal wallet-chooser-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'walletChooserTitle');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close-modal-btn';
  closeButton.id = 'closeWalletChooserBtn';
  closeButton.setAttribute('aria-label', 'Close Wallet Chooser');
  closeButton.textContent = '×';

  const title = document.createElement('h3');
  title.id = 'walletChooserTitle';
  title.textContent = 'Choose a wallet';

  const subtitle = document.createElement('p');
  subtitle.className = 'text-muted';
  subtitle.textContent = 'Connect with an installed wallet or use WalletConnect.';

  const options = document.createElement('div');
  options.id = 'walletChooserOptions';
  options.className = 'modal-actions wallet-chooser-options';

  dialog.append(closeButton, title, subtitle, options);
  modal.appendChild(dialog);
  return modal;
}

export function renderWalletChooserOptions(container, chooserOptions) {
  clearNode(container);
  for (const option of chooserOptions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn wallet-choice-btn';
    button.dataset.walletChoice = option.choice;
    button.setAttribute('aria-label', option.label);

    const strong = document.createElement('strong');
    strong.textContent = option.label;
    const span = document.createElement('span');
    span.textContent = option.helper;

    button.append(strong, span);
    container.appendChild(button);
  }
}

export function createSimpleModal({ titleText, bodyNodes = [], actionButtons = [] }) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const content = document.createElement('div');
  content.className = 'modal-content';

  if (titleText) {
    const title = document.createElement('h2');
    title.textContent = titleText;
    content.appendChild(title);
  }

  for (const node of bodyNodes) {
    if (node) content.appendChild(node);
  }

  for (const button of actionButtons) {
    if (button) content.appendChild(button);
  }

  modal.appendChild(content);
  return modal;
}

export function renderTxHistoryTableBody(tbody, txs) {
  clearNode(tbody);

  if (!Array.isArray(txs) || txs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'text-gray';
    td.textContent = 'No transactions found.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const tx of txs) {
    const tr = document.createElement('tr');
    for (const value of [tx.date, tx.type, tx.amount, tx.token, tx.status]) {
      const td = document.createElement('td');
      td.textContent = String(value ?? '');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

export function renderRewardList(list, rewards, currentProgress) {
  clearNode(list);
  for (const reward of rewards) {
    const li = document.createElement('li');
    const unlocked = currentProgress >= reward.threshold;
    li.className = unlocked ? 'unlocked' : 'locked';

    const icon = document.createElement('span');
    icon.className = 'reward-icon';
    icon.textContent = unlocked ? '✅' : '🔒';

    li.append(icon, document.createTextNode(` $${reward.threshold}+: ${reward.reward}`));
    list.appendChild(li);
  }
}

export function renderAchievements(list, achievements) {
  clearNode(list);
  for (const achievement of achievements) {
    const li = document.createElement('li');
    li.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;

    const icon = document.createElement('div');
    icon.className = 'achievement-icon';
    icon.textContent = achievement.unlocked ? '🏆' : '🔒';

    const info = document.createElement('div');
    info.className = 'achievement-info';
    const heading = document.createElement('h4');
    heading.textContent = achievement.name;
    const description = document.createElement('p');
    description.textContent = achievement.description;
    info.append(heading, description);

    li.append(icon, info);
    list.appendChild(li);
  }
}

export function createTradeNotification(amount) {
  const notification = document.createElement('div');
  notification.className = 'trade-notification';
  notification.textContent = `💰 +$${Number(amount).toFixed(2)} volume!`;
  return notification;
}
