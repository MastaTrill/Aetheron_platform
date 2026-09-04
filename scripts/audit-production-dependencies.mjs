import { execFileSync } from 'node:child_process';
import path from 'node:path';

const npmCli = path.join(process.env.ProgramFiles || 'C:/Program Files', 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js');
const nodeExe = process.execPath;
const projects = [
  ['root', process.cwd()],
  ['backend', path.join(process.cwd(), 'backend')],
  ['contracts', path.join(process.cwd(), 'smart-contract')],
];

function dependencyTree(cwd) {
  const stdout = execFileSync(
    nodeExe,
    [npmCli, 'ls', '--omit=dev', '--all', '--json'],
    { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  return JSON.parse(stdout);
}

function flatten(node, out = new Map()) {
  for (const [name, dep] of Object.entries(node.dependencies || {})) {
    if (dep?.version) out.set(`${name}@${dep.version}`, { name, version: dep.version });
    flatten(dep || {}, out);
  }
  return [...out.values()];
}

const sets = Object.fromEntries(projects.map(([label, cwd]) => [label, flatten(dependencyTree(cwd))]));
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