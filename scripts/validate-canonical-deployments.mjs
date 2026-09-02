import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANONICAL_ADDRESS = '0xecf7e17fae148c01e1b5008a31dfd2d1b6608e4e';
const CANONICAL_CHAIN_ID = 8453;
const LEGACY_MARKERS = [
  '0x44f9c15816bce5d6691448f60dad50355aba40b5',
  '0xab5ae0d8f569d7c2b27574319b864a5ba6f9671e',
  'mumbai.polygonscan.com',
  'chain id: 80001',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

const manifest = readJson('smart-contract/deployments/aeth-base.json');
const registry = readJson('docs/AETHERON_CONTRACT_REGISTRY.json');

const errors = [];
const manifestAddress = String(manifest?.token?.address ?? '').toLowerCase();
if (manifest?.chainId !== CANONICAL_CHAIN_ID) {
  errors.push(`aeth-base.json chainId must be ${CANONICAL_CHAIN_ID}`);
}
if (manifestAddress !== CANONICAL_ADDRESS) {
  errors.push('aeth-base.json token address does not match canonical AETH');
}

const registryText = JSON.stringify(registry).toLowerCase();
if (!registryText.includes(CANONICAL_ADDRESS)) {
  errors.push('ecosystem registry does not contain canonical AETH address');
}
if (!registryText.includes(String(CANONICAL_CHAIN_ID))) {
  errors.push('ecosystem registry does not contain Base mainnet chain ID');
}

const scanRoots = ['src', 'smart-contract/config', 'smart-contract/scripts'];
const allowedExtensions = new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx', '.json', '.html']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() === 'archive') continue;
      out.push(...walk(full));
    } else if (allowedExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

for (const root of scanRoots) {
  for (const file of walk(path.join(ROOT, root))) {
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    for (const marker of LEGACY_MARKERS) {
      if (text.includes(marker)) {
        errors.push(`legacy production marker '${marker}' found in ${path.relative(ROOT, file)}`);
      }
    }
  }
}

if (errors.length) {
  console.error('Canonical deployment validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Canonical Base deployment validation passed.');
