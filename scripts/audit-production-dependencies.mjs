import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath
  || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const nodeExe = process.execPath;
const projects = [
  ['root', process.cwd()],
  ['backend', path.join(process.cwd(), 'backend')],
  ['contracts', path.join(process.cwd(), 'smart-contract')],
];

function dependencyTree(label, cwd) {
  const outputPath = path.join(os.tmpdir(), `aetheron-prod-tree-${process.pid}-${label}.json`);
  let outputFd;
  try {
    outputFd = fs.openSync(outputPath, 'w');
    const result = spawnSync(
      nodeExe,
      [npmCli, 'ls', '--omit=dev', '--all', '--json'],
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', outputFd, 'pipe'],
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(
        `${label} production dependency tree failed with exit ${result.status}: ${String(result.stderr || '').trim()}`,
      );
    }
  } finally {
    if (outputFd !== undefined) fs.closeSync(outputFd);
  }

  try {
    return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } finally {
    fs.rmSync(outputPath, { force: true });
  }
}

function flatten(node, out = new Map()) {
  for (const [name, dep] of Object.entries(node.dependencies || {})) {
    if (dep?.version) out.set(`${name}@${dep.version}`, { name, version: dep.version });
    flatten(dep || {}, out);
  }
  return [...out.values()];
}

const sets = Object.fromEntries(
  projects.map(([label, cwd]) => [label, flatten(dependencyTree(label, cwd))]),
);
const unique = new Map();
for (const list of Object.values(sets)) {
  for (const pkg of list) unique.set(`${pkg.name}@${pkg.version}`, pkg);
}
const packages = [...unique.values()];
const queries = packages.map((pkg) => ({
  package: { name: pkg.name, ecosystem: 'npm' },
  version: pkg.version,
}));

const response = await fetch('https://api.osv.dev/v1/querybatch', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ queries }),
  signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw new Error(`OSV audit request failed with HTTP ${response.status}`);
const data = await response.json();

let vulnerablePackageCount = 0;
for (const [label, list] of Object.entries(sets)) {
  const keys = new Set(list.map((pkg) => `${pkg.name}@${pkg.version}`));
  const hits = [];
  for (let i = 0; i < packages.length; i += 1) {
    const vulns = data.results?.[i]?.vulns || [];
    if (vulns.length && keys.has(`${packages[i].name}@${packages[i].version}`)) {
      hits.push({ ...packages[i], ids: vulns.map((vuln) => vuln.id) });
    }
  }
  vulnerablePackageCount += hits.length;
  console.log(`${label}: ${hits.length} vulnerable production package(s)`);
  for (const hit of hits) console.log(`  ${hit.name}@${hit.version}: ${hit.ids.join(', ')}`);
}

console.log(`total: ${vulnerablePackageCount} vulnerable production package(s)`);
if (vulnerablePackageCount > 0) process.exit(1);