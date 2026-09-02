import fs from 'node:fs';

const files = [
  'analytics/analytics.js',
  'analytics-dashboard.html',
  'dashboard-enhanced.html',
  'governance.html',
  'index-dom-overrides.js',
  'leaderboard-config.json',
  'leaderboard-init.js',
  'leaderboard.html',
  'portfolio-init.js',
  'portfolio.html',
  'presale.js',
  'price-alerts.html',
  'privacy-policy.html',
  'pro-charts-portfolio.js',
  'referral.html',
  'roadmap.html',
  'terms-of-service.html',
  'transaction-history.html',
];

const replacements = [
  [/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e/gi, '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e'],
  [/https:\/\/polygon-rpc\.com/gi, 'https://mainnet.base.org'],
  [/https:\/\/rpc-mainnet\.matic\.network/gi, 'https://base.drpc.org'],
  [/https:\/\/api\.polygonscan\.com/gi, 'https://api.basescan.org'],
  [/https:\/\/polygonscan\.com/gi, 'https://basescan.org'],
  [/\/\/polygon-rpc\.com/gi, '//mainnet.base.org'],
  [/\/\/polygonscan\.com/gi, '//basescan.org'],
  [/Chain ID:\s*137\b/g, 'Chain ID: 8453'],
  [/Chain ID\s+137\b/g, 'Chain ID 8453'],
  [/chainId\s*:\s*137\b/g, 'chainId: 8453'],
  [/"chainId"\s*:\s*137\b/g, '"chainId": 8453'],
];

let changed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Expected current production file missing: ${file}`);
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const [pattern, replacement] of replacements) {
    after = after.replace(pattern, replacement);
  }

  if (file === 'analytics-dashboard.html') {
    after = after.replace(/^\s*<link rel="dns-prefetch" href="\/\/quickswap\.exchange">\s*\r?\n/gm, '');
  }

  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
  }
}

if (changed === 0) throw new Error('Base current-surface patch made no changes');

const forbidden = [
  /0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e/i,
  /polygon-rpc\.com/i,
  /rpc-mainnet\.matic\.network/i,
  /polygonscan\.com/i,
  /chain id:\s*137\b/i,
];

const failures = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of forbidden) {
    if (marker.test(text)) failures.push(`${file}: ${marker}`);
  }
}
if (failures.length) {
  throw new Error(`Current production files still contain stale deployment markers:\n${failures.join('\n')}`);
}

console.log(`Updated ${changed} current production files to canonical Base deployment metadata.`);
