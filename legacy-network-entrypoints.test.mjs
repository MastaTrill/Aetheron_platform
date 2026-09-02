import fs from 'node:fs';

const smartPackage = JSON.parse(
  fs.readFileSync(new URL('./smart-contract/package.json', import.meta.url), 'utf8'),
);

const forbiddenNetwork = /\b(?:polygon|mumbai|solana)\b/i;
const violations = [];

for (const [name, command] of Object.entries(smartPackage.scripts || {})) {
  if (forbiddenNetwork.test(name) || forbiddenNetwork.test(command)) {
    violations.push(`${name}=${command}`);
  }
}

if (violations.length > 0) {
  console.error('Executable legacy-network package scripts remain:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('No executable Polygon/Mumbai/Solana package entry points remain.');
