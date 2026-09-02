import fs from 'node:fs';

const path = 'dashboard.js';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(expected, replacement, label) {
  if (!source.includes(expected)) {
    throw new Error(`Missing expected source text: ${label}`);
  }
  source = source.replace(expected, () => replacement);
}

replaceOnce(
  "progressText.textContent = `${this.tradingRewards.currentProgress.toFixed(0)} / ${this.tradingRewards.dailyTarget}`;",
  "progressText.textContent = `$${this.tradingRewards.currentProgress.toFixed(0)} / $${this.tradingRewards.dailyTarget}`;",
  'trading progress currency labels',
);

replaceOnce(
  "document.createTextNode(` ${reward.threshold}+: ${reward.reward}`),",
  "document.createTextNode(` $${reward.threshold}+: ${reward.reward}`),",
  'reward threshold currency label',
);

replaceOnce(
  "notification.textContent = `💰 +${Number(amount).toFixed(2)} volume!`;",
  "notification.textContent = `💰 +$${Number(amount).toFixed(2)} volume!`;",
  'trade notification currency label',
);

if (/\.innerHTML\s*=/.test(source)) {
  throw new Error('dashboard.js still contains innerHTML assignment');
}
if (/function\s+setContainerHtml\s*\(/.test(source)) {
  throw new Error('dashboard.js still contains setContainerHtml');
}
if (/createDashboardModal\s*\(\s*`/.test(source)) {
  throw new Error('dashboard.js still contains template-string modal calls');
}

fs.writeFileSync(path, source, 'utf8');
console.log('Corrected dashboard DOM-safe currency text');
