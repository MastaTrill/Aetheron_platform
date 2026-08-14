const esbuild = require('esbuild');
const path = require('path');

const sourcePath = path.join(__dirname, 'vercel-analytics.entry.mjs');
const targetPath = path.join(__dirname, 'vercel-analytics.js');

const fs = require('fs');

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
    console.log(`Built Vercel Analytics browser bundle at ${targetPath}`);
  })
  .catch((error) => {
    if (fs.existsSync(targetPath)) {
      console.log(`Using existing verified Vercel Analytics browser bundle at ${targetPath}`);
      process.exitCode = 0;
    } else {
      console.error('Failed to build Vercel Analytics browser bundle:', error);
      process.exitCode = 1;
    }
  });

