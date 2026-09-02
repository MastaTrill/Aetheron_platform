import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => !file.endsWith('package-lock.json'))
  .filter((file) => !file.includes('/artifacts/'))
  .filter((file) => !file.includes('/cache/'));

const placeholder = /(?:example|placeholder|replace|changeme|dummy|your[_ -]|<[^>]+>|\$\{|test[_ -]?only)/i;
const rules = [
  ['EVM private key assignment', /(?:private[_-]?key|deployer[_-]?key|wallet[_-]?key|signer[_-]?key)\s*["']?\s*[:=]\s*["']((?:0x)?[a-fA-F0-9]{64})["']/gi],
  ['mnemonic assignment', /(?:mnemonic|seed[_ -]?phrase)\s*["']?\s*[:=]\s*["']([^"']{20,})["']/gi],
  ['PEM private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['OpenAI secret key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ['Stripe secret key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['credentialed URL', /https?:\/\/([^\s"'/:]+):([^\s"'@]+)@[^\s"']+/g],
  ['service secret assignment', /(?:client[_-]?secret|api[_-]?secret|access[_-]?token|refresh[_-]?token)\s*["']?\s*[:=]\s*["']([A-Za-z0-9_\-\/.+=]{20,})["']/gi],
];

const findings = [];
for (const file of files) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const [name, pattern] of rules) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const candidate = match.slice(1).filter(Boolean).join(':') || match[0];
      if (!placeholder.test(candidate) && !placeholder.test(match[0])) {
        findings.push(`${file}: ${name}`);
        break;
      }
    }
  }
}

if (findings.length) {
  console.error('Potential high-confidence secrets detected. Review and rotate before merging:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`Tracked high-confidence secret scan passed across ${files.length} files.`);
