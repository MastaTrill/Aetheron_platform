import fs from 'node:fs';

const path = 'dashboard.js';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches) throw new Error(`Missing expected source block: ${label}`);
  source = source.replace(pattern, replacement);
}

replaceOnce(
  /function escapeHtml\(text\) \{[\s\S]*?\}\n\n(?=function setElementText)/,
  `function clearNode(node) {\n  if (!node) return;\n  node.replaceChildren();\n}\n\nfunction renderTableMessageRow(container, message, colSpan = 1, className = 'text-gray') {\n  if (!container) return;\n  clearNode(container);\n  const row = document.createElement('tr');\n  const cell = document.createElement('td');\n  cell.colSpan = colSpan;\n  if (className) cell.className = className;\n  cell.textContent = message;\n  row.appendChild(cell);\n  container.appendChild(row);\n}\n\n`,
  'escapeHtml helper',
);

replaceOnce(
  /function setContainerHtml\(container, html\) \{[\s\S]*?\}\n\n(?=function getDashboardApp)/,
  '',
  'setContainerHtml helper',
);

replaceOnce(
  /function createDashboardModal\(contentHtml\) \{[\s\S]*?\n\}\n\n(?=function bindModalClose)/,
  `function createDashboardModal({ titleText = '', bodyNodes = [], actionButtons = [] } = {}) {\n  const modal = document.createElement('div');\n  modal.className = 'modal';\n  const content = document.createElement('div');\n  content.className = 'modal-content';\n\n  if (titleText) {\n    const title = document.createElement('h2');\n    title.textContent = titleText;\n    content.appendChild(title);\n  }\n  for (const node of bodyNodes) {\n    if (node) content.appendChild(node);\n  }\n  for (const button of actionButtons) {\n    if (button) content.appendChild(button);\n  }\n\n  modal.appendChild(content);\n  document.body.appendChild(modal);\n  return modal;\n}\n\n`,
  'createDashboardModal helper',
);

replaceOnce(
  /  renderTxHistory\(\) \{[\s\S]*?\n  \}\n\n  exportTxCsv\(\)/,
  `  renderTxHistory() {\n    const tableBody = document\n      .getElementById('txHistoryTable')\n      ?.querySelector('tbody');\n    const type = document.getElementById('txTypeFilter')?.value || 'all';\n    const date = document.getElementById('txDateFilter')?.value || '';\n\n    if (!tableBody) return;\n\n    let txs = this.getTxHistory();\n    if (type !== 'all') txs = txs.filter((tx) => tx.type === type);\n    if (date) txs = txs.filter((tx) => String(tx.date || '').startsWith(date));\n\n    clearNode(tableBody);\n    if (!txs.length) {\n      renderTableMessageRow(tableBody, 'No transactions found.', 5);\n      return;\n    }\n\n    txs.forEach((tx) => {\n      const row = document.createElement('tr');\n      [tx.date, tx.type, tx.amount, tx.token, tx.status].forEach((value) => {\n        const cell = document.createElement('td');\n        cell.textContent = String(value ?? '');\n        row.appendChild(cell);\n      });\n      tableBody.appendChild(row);\n    });\n  }\n\n  exportTxCsv()`,
  'renderTxHistory',
);

replaceOnce(
  /  updateTradingRewards\(\) \{[\s\S]*?\n  \}\n\n  showTradeNotification\(amount\) \{[\s\S]*?\n  \}\n\n  generateReferralCode\(\)/,
  `  updateTradingRewards() {\n    const progressBar = document.getElementById('volume-progress');\n    const progressText = document.getElementById('volume-text');\n    const rewardsList = document.getElementById('trading-rewards');\n\n    if (progressBar && progressText) {\n      const progress =\n        (this.tradingRewards.currentProgress / this.tradingRewards.dailyTarget) * 100;\n      progressBar.style.width = \`${'${'}Math.min(progress, 100)}%\`;\n      progressText.textContent = \`$${'${'}this.tradingRewards.currentProgress.toFixed(0)} / $${'${'}this.tradingRewards.dailyTarget}\`;\n    }\n\n    if (rewardsList) {\n      clearNode(rewardsList);\n      this.tradingRewards.rewards.forEach((reward) => {\n        const li = document.createElement('li');\n        const isUnlocked = this.tradingRewards.currentProgress >= reward.threshold;\n        li.className = isUnlocked ? 'unlocked' : 'locked';\n        const icon = document.createElement('span');\n        icon.className = 'reward-icon';\n        icon.textContent = isUnlocked ? '✅' : '🔒';\n        li.append(\n          icon,\n          document.createTextNode(\` $${'${'}reward.threshold}+: ${'${'}reward.reward}\`),\n        );\n        rewardsList.appendChild(li);\n      });\n    }\n  }\n\n  showTradeNotification(amount) {\n    const notification = document.createElement('div');\n    notification.className = 'trade-notification';\n    notification.textContent = \`💰 +$${'${'}Number(amount).toFixed(2)} volume!\`;\n    document.body.appendChild(notification);\n    setTimeout(() => notification.remove(), 3000);\n  }\n\n  generateReferralCode()`,
  'trading rewards and notification',
);

replaceOnce(
  /  updateAchievements\(\) \{[\s\S]*?\n  \}\n\n  async updateLiveStats\(\)/,
  `  updateAchievements() {\n    const achievementsList = document.getElementById('achievements-list');\n    if (!achievementsList) return;\n\n    clearNode(achievementsList);\n    this.achievements.forEach((achievement) => {\n      const li = document.createElement('li');\n      li.className = \`achievement ${'${'}achievement.unlocked ? 'unlocked' : 'locked'}\`;\n\n      const icon = document.createElement('div');\n      icon.className = 'achievement-icon';\n      icon.textContent = achievement.unlocked ? '🏆' : '🔒';\n\n      const info = document.createElement('div');\n      info.className = 'achievement-info';\n      const heading = document.createElement('h4');\n      heading.textContent = achievement.name;\n      const description = document.createElement('p');\n      description.textContent = achievement.description;\n      info.append(heading, description);\n\n      li.append(icon, info);\n      achievementsList.appendChild(li);\n    });\n  }\n\n  async updateLiveStats()`,
  'updateAchievements',
);

replaceOnce(
  /        setContainerHtml\(\n          stakingTableBody,\n          '<tr><td colspan="5">No data \(stub\)<\/td><\/tr>',\n        \);/,
  `        renderTableMessageRow(stakingTableBody, 'No data (stub)', 5);`,
  'staking placeholder',
);

replaceOnce(
  /            const modal = createDashboardModal\(`\n              <h2>Edit Profile<\/h2>[\s\S]*?            `\);/,
  `            const nameLabel = document.createElement('label');\n            nameLabel.textContent = 'Name: ';\n            const nameInput = document.createElement('input');\n            nameInput.id = 'profileNameInput';\n            nameInput.type = 'text';\n            nameInput.value = 'Alex';\n            nameLabel.appendChild(nameInput);\n\n            const emailLabel = document.createElement('label');\n            emailLabel.textContent = 'Email: ';\n            const emailInput = document.createElement('input');\n            emailInput.id = 'profileEmailInput';\n            emailInput.type = 'email';\n            emailInput.value = 'alex@email.com';\n            emailLabel.appendChild(emailInput);\n\n            const save = document.createElement('button');\n            save.id = 'saveProfileBtn';\n            save.type = 'button';\n            save.textContent = 'Save';\n            const close = document.createElement('button');\n            close.id = 'closeProfileModalBtn';\n            close.type = 'button';\n            close.textContent = 'Close';\n\n            const modal = createDashboardModal({\n              titleText: 'Edit Profile',\n              bodyNodes: [nameLabel, document.createElement('br'), emailLabel, document.createElement('br')],\n              actionButtons: [save, close],\n            });`,
  'profile modal',
);

replaceOnce(
  /            const modal = createDashboardModal\(`\n              <h2>Welcome to Aetheron!<\/h2>[\s\S]*?            `\);/,
  `            const video = document.createElement('video');\n            video.controls = true;\n            video.autoplay = true;\n            video.width = 400;\n            const sourceNode = document.createElement('source');\n            sourceNode.src = 'onboarding.mp4';\n            sourceNode.type = 'video/mp4';\n            video.append(\n              sourceNode,\n              document.createTextNode('Your browser does not support the video tag.'),\n            );\n            const close = document.createElement('button');\n            close.id = 'closeVideoModalBtn';\n            close.type = 'button';\n            close.textContent = 'Close';\n            const modal = createDashboardModal({\n              titleText: 'Welcome to Aetheron!',\n              bodyNodes: [video],\n              actionButtons: [close],\n            });`,
  'video modal',
);

replaceOnce(
  /            const modal = createDashboardModal\(`\n                <h2>Gamified Tutorial<\/h2>[\s\S]*?            `\);/,
  `            const paragraph = document.createElement('p');\n            paragraph.textContent = 'Complete tasks to earn badges and rewards!';\n            const list = document.createElement('ul');\n            [\n              ['Connect your wallet ', 'task1Status'],\n              ['Make your first trade ', 'task2Status'],\n              ['Vote in governance ', 'task3Status'],\n            ].forEach(([label, id]) => {\n              const item = document.createElement('li');\n              const status = document.createElement('span');\n              status.id = id;\n              status.textContent = '❌';\n              item.append(document.createTextNode(label), status);\n              list.appendChild(item);\n            });\n            const close = document.createElement('button');\n            close.id = 'closeTutorialModalBtn';\n            close.type = 'button';\n            close.textContent = 'Close';\n            const modal = createDashboardModal({\n              titleText: 'Gamified Tutorial',\n              bodyNodes: [paragraph, list],\n              actionButtons: [close],\n            });`,
  'tutorial modal',
);

if (/\.innerHTML\s*=/.test(source)) {
  throw new Error('dashboard.js still contains innerHTML assignment after patch');
}
if (/function\s+setContainerHtml\s*\(/.test(source)) {
  throw new Error('setContainerHtml still exists after patch');
}
if (/createDashboardModal\s*\(\s*`/.test(source)) {
  throw new Error('template-string dashboard modal call remains after patch');
}

fs.writeFileSync(path, source, 'utf8');
console.log('Applied dashboard source-native DOM safety patch');
