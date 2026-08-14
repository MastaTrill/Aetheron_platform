import fs from 'fs';
import path from 'path';

function searchAddress(dir, target, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'AppData') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...searchAddress(fullPath, target, maxDepth, currentDepth + 1));
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes(target.toLowerCase())) {
            results.push(fullPath);
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  return results;
}

const target = '0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa';
const matches = searchAddress('C:\\Users\\willi', target);
console.log(`Found ${matches.length} files referencing ${target}:`);
matches.forEach(m => console.log(' -', m));
