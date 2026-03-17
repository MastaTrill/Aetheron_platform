const { mkdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const action = process.argv[2];
const rootDir = __dirname;
const smartContractDir = join(rootDir, 'smart-contract');
const appDataDir = join(rootDir, '.appdata');
const localAppDataDir = join(rootDir, '.localappdata');

mkdirSync(appDataDir, { recursive: true });
mkdirSync(localAppDataDir, { recursive: true });

const env = {
  ...process.env,
  APPDATA: appDataDir,
  LOCALAPPDATA: localAppDataDir,
};

let command;
let cwd = smartContractDir;
let steps;

switch (action) {
  case 'test':
    steps = [{ command: 'npm', args: ['test'] }];
    break;
  case 'compile':
    steps = [
      { command: 'npx', args: ['hardhat', 'clean'] },
      { command: 'npx', args: ['hardhat', 'compile'] },
    ];
    break;
  case 'verify':
    steps = [{ command: 'node', args: ['scripts/verify-contracts.mjs'] }];
    break;
  default:
    console.error(`Unknown action: ${action || '(missing)'}`);
    process.exit(1);
}

for (const step of steps) {
  const result = spawnSync(step.command, step.args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.exit(0);
