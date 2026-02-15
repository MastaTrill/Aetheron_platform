// fix-litepaper-inline.js
// Usage: node fix-litepaper-inline.js
// This script moves the <style> tag content to litepaper.css, adds link to it, and removes inline styles by adding classes.
// It also adds type="button" to all <button> elements.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, 'litepaper.html');
const cssPath = path.join(__dirname, 'litepaper.css');

let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract and move <style> content to litepaper.css
const styleRegex = /<style>(.*?)<\/style>/s;
const styleMatch = html.match(styleRegex);
if (styleMatch) {
  const styleContent = styleMatch[1];
  fs.writeFileSync(cssPath, styleContent, 'utf8');
  html = html.replace(
    styleRegex,
    '<link rel="stylesheet" href="litepaper.css">',
  );
}

// 2. Remove inline styles and add classes
// For links with color:#00d4ff
html = html.replace(
  /<a([^>]*?)style="color:#00d4ff"([^>]*?)>/g,
  '<a$1class="accent-link"$2>',
);

// For display:inline-block with button styles
html = html.replace(
  /<a([^>]*?)style="display:inline-block;padding:1rem 2rem;background:linear-gradient\(135deg,#00d4ff,#8a2be2\);border-radius:12px;color:#fff;text-decoration:none;font-weight:600;margin:\.5rem"([^>]*?)>/g,
  '<a$1class="btn-primary"$2>',
);

// For display:inline-block with secondary button
html = html.replace(
  /<a([^>]*?)style="display:inline-block;padding:1rem 2rem;background:rgba\(0,212,255,\.2\);border:1px solid #00d4ff;border-radius:12px;color:#fff;text-decoration:none;font-weight:600;margin:\.5rem"([^>]*?)>/g,
  '<a$1class="btn-secondary"$2>',
);

// For ul with margin-top:1rem
html = html.replace(
  /<ul([^>]*?)style="margin-top:1rem"([^>]*?)>/g,
  '<ul$1class="warning-list"$2>',
);

// For div with margin-top:3rem;text-align:center
html = html.replace(
  /<div([^>]*?)style="margin-top:3rem;text-align:center"([^>]*?)>/g,
  '<div$1class="conclusion-highlight"$2>',
);

// For h3 with color:#00d4ff;margin-bottom:1rem
html = html.replace(
  /<h3([^>]*?)style="color:#00d4ff;margin-bottom:1rem"([^>]*?)>/g,
  '<h3$1class="highlight-title"$2>',
);

// For p with margin-bottom:1.5rem
html = html.replace(
  /<p([^>]*?)style="margin-bottom:1.5rem"([^>]*?)>/g,
  '<p$1class="highlight-text"$2>',
);

// For hr with border:none;border-top:1px solid rgba(255,255,255,.1);margin:3rem 0
html = html.replace(
  /<hr([^>]*?)style="border:none;border-top:1px solid rgba\(255,255,255,\.1\);margin:3rem 0"([^>]*?)>/g,
  '<hr$1class="section-divider"$2>',
);

// For p with text-align:center;color:#666;font-size:.9rem
html = html.replace(
  /<p([^>]*?)style="text-align:center;color:#666;font-size:\.9rem"([^>]*?)>/g,
  '<p$1class="footer-text"$2>',
);

// 3. Add type="button" to all <button> that do not have type attribute
html = html.replace(
  /<button([^>]*?)(?<!type="submit")((?<!type="button")(?<!type='button'))>/g,
  (match, attrs) => {
    if (/type\s*=/.test(attrs)) return match;
    return `<button${attrs} type="button">`;
  },
);

// 4. Add classes to litepaper.css
let css = fs.readFileSync(cssPath, 'utf8');
css += `
.accent-link { color: #00d4ff; }
.btn-primary {
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00d4ff, #8a2be2);
  border-radius: 12px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  margin: .5rem;
}
.btn-secondary {
  display: inline-block;
  padding: 1rem 2rem;
  background: rgba(0,212,255,.2);
  border: 1px solid #00d4ff;
  border-radius: 12px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  margin: .5rem;
}
.warning-list { margin-top: 1rem; }
.conclusion-highlight { margin-top: 3rem; text-align: center; }
.highlight-title { color: #00d4ff; margin-bottom: 1rem; }
.highlight-text { margin-bottom: 1.5rem; }
.section-divider { border: none; border-top: 1px solid rgba(255,255,255,.1); margin: 3rem 0; }
.footer-text { text-align: center; color: #666; font-size: .9rem; }
`;
fs.writeFileSync(cssPath, css, 'utf8');

fs.writeFileSync(htmlPath, html, 'utf8');

console.log(
  '✅ Updated litepaper.html: moved <style> to litepaper.css, removed inline styles, added classes, and added type="button" to buttons.',
);
