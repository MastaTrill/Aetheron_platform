import fs from 'fs';
import path from 'path';

function findEnvFiles(dir, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'AppData') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findEnvFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.name.startsWith('.env')) {
        results.push(fullPath);
      }
    }
  } catch (e) {}
  return results;
}

const envFiles = findEnvFiles('C:\\Users\\willi');
console.log('Found .env files:');
envFiles.forEach(f => console.log(' -', f));
