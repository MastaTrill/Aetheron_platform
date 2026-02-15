// fix-analytics-dashboard-inline.js
// Usage: node fix-analytics-dashboard-inline.js
// This script moves inline styles from analytics-dashboard.html to analytics-dashboard.css and adds type="button" to buttons.
// Place this script in the same folder as analytics-dashboard.html and run it with Node.js.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, 'analytics-dashboard.html');
const cssPath = path.join(__dirname, 'analytics-dashboard.css');

let html = fs.readFileSync(htmlPath, 'utf8');
let css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

// 1. Extract inline styles from <style> tag and move to CSS file
const styleTagRegex = /<style>(.*?)<\/style>/s;
const styleMatch = html.match(styleTagRegex);
if (styleMatch) {
  const inlineStyles = styleMatch[1];
  css += '\n/* Moved from inline styles */\n' + inlineStyles + '\n';
  html = html.replace(
    styleTagRegex,
    '<link rel="stylesheet" href="analytics-dashboard.css">',
  );
}

// 2. Remove inline style attributes from nav and body
html = html.replace(/<nav[^>]*style="[^"]*"[^>]*>/g, (match) =>
  match.replace(/ style="[^"]*"/, ''),
);
html = html.replace(/<div[^>]*style="[^"]*"[^>]*>/g, (match) =>
  match.replace(/ style="[^"]*"/, ''),
);
html = html.replace(/<a[^>]*style="[^"]*"[^>]*>/g, (match) =>
  match.replace(/ style="[^"]*"/, ''),
);

// 3. Add type="button" to all <button> elements
html = html.replace(/<button(?![^>]*type)/g, '<button type="button"');

// Write back the files
fs.writeFileSync(htmlPath, html, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8');

console.log(
  '✅ Updated analytics-dashboard.html: moved inline styles to CSS and added type="button" to buttons.',
);
console.log('✅ Updated analytics-dashboard.css: added moved styles.');
