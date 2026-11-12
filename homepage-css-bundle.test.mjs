import assert from 'node:assert/strict';
import fs from 'node:fs';

const cssFiles = ['critical.css', 'index.css', 'shared-styles.css', 'mobile-optimization.css'];
const header = '/* Homepage stylesheet bundle; exact ordered concatenation of the four source files. Keep order to preserve cascade and avoid flash of unstyled content. */\n';
const expected = header + cssFiles.map((file) => `\n/* BEGIN ${file} */\n${fs.readFileSync(file, 'utf8')}\n/* END ${file} */\n`).join('');
assert.equal(fs.readFileSync('homepage-core.css', 'utf8'), expected, 'Homepage CSS bundle must exactly match source order; rebuild when sources change.');
const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /href="homepage-core\.css\?v=[^"]+"/, 'Homepage must load the combined CSS');
for (const file of cssFiles) {
  assert.ok(!html.includes(`rel="stylesheet" href="${file}`), `Homepage must not load duplicate ${file}`);
}
console.log('Homepage stylesheet bundle and first-paint links verified');
