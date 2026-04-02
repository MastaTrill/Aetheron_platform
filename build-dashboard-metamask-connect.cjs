const esbuild = require('esbuild');
const path = require('path');

const sourcePath = path.join(
  __dirname,
  'dashboard-metamask-connect.entry.mjs',
);

const targetPath = path.join(
  __dirname,
  'dashboard-metamask-connect.js',
);

esbuild
  .build({
    entryPoints: [sourcePath],
    outfile: targetPath,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    mainFields: ['browser', 'module', 'main'],
    conditions: ['browser'],
    minify: true,
    logLevel: 'info',
  })
  .then(() => {
    console.log(`Built MetaMask multichain browser bundle at ${targetPath}`);
  })
  .catch((error) => {
    console.error('Failed to build MetaMask multichain browser bundle:', error);
    process.exitCode = 1;
  });
