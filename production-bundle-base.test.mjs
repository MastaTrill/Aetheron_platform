import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

assert.ok(fs.existsSync(DIST), 'dist must exist before production-bundle validation');

const forbiddenMarkers = [
  '0x44f9c15816bce5d6691448f60dad50355aba40b5',
  '0xab5ae0d8f569d7c2b27574319b864a5ba6f9671e',
  '5fryq4upbzwkix8j3jtqhntdxtssox24vydq8gqbfqki',
  'mumbai.polygonscan.com',
  'rpc-mumbai',
  'polygon-rpc.com',
  'quickswap.exchange',
  'chain id: 137',
  'chain id 137',
  'chain id: 80001',
  'chain id 80001',
  'chain id: 80002',
  'chain id 80002',
  'smart-routing-ui.html',
  'trading-terminal-pro.html',
];

const textExtensions = new Set([
  '.html', '.js', '.json', '.md', '.txt', '.xml', '.webmanifest', '.sol', '.cjs', '.mjs',
]);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const distFiles = walk(DIST);
const packagedNodeModules = distFiles
  .map((file) => path.relative(DIST, file))
  .filter((relative) => relative.split(path.sep).includes('node_modules'));

assert.deepEqual(
  packagedNodeModules,
  [],
  `Production bundle must not contain nested node_modules files:\n${packagedNodeModules.slice(0, 20).map((item) => `- ${item}`).join('\n')}`,
);

const failures = [];
for (const file of distFiles) {
  const ext = path.extname(file).toLowerCase();
  if (!textExtensions.has(ext)) continue;
  const text = fs.readFileSync(file, 'utf8').toLowerCase();
  for (const marker of forbiddenMarkers) {
    if (text.includes(marker)) {
      failures.push(`${path.relative(ROOT, file)} contains legacy marker '${marker}'`);
    }
  }
}

assert.deepEqual(
  failures,
  [],
  `Production bundle contains stale non-Base deployment references:\n${failures.map((item) => `- ${item}`).join('\n')}`,
);

console.log('Production bundle contains no stale Polygon/Mumbai/Solana deployment markers.');
