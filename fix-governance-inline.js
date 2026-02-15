// fix-governance-inline.js
// Usage: node fix-governance-inline.js
// This script replaces all style="width:XX%" on .vote-bar-fill with class="vote-bar-fill width-XX" and removes the style attribute.
// It also adds type="button" to all non-submit <button> elements.
// Place this script in the same folder as governance.html and run it with Node.js.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, 'governance.html');
const cssPath = path.join(__dirname, 'governance.css');

let html = fs.readFileSync(htmlPath, 'utf8');

console.log('HTML length:', html.length);

// Check if the string is in html
const hasVote = html.includes('vote-bar-fill');
console.log('Has vote-bar-fill:', hasVote);

const index = html.indexOf('vote-bar-fill');
console.log('Index of vote-bar-fill:', index);
if (index > 0) {
  console.log('Context:', html.substring(index - 20, index + 80));
}

// Test the regex
const testString = '<div class="vote-bar-fill"style="width:78%">'; // no space
const widthRegex = /class="([^"]*vote-bar-fill[^"]*)"\s*style="width:(\d+)%"/g;
const match = testString.match(widthRegex);
console.log('Test match:', match);

if (match) {
  const replaced = testString.replace(widthRegex, (match, classes, width) => {
    return `class="${classes} width-${width}"`;
  });
  console.log('Test replaced:', replaced);
}

// 1. Replace style="width:XX%" on .vote-bar-fill with class width-XX
let widths = new Set();
html = html.replace(widthRegex, (match, classes, width) => {
  console.log('Match:', match, 'Classes:', classes, 'Width:', width);
  widths.add(width);
  return `class="${classes} width-${width}"`;
});
console.log('Widths found:', widths);

// Remove the style attributes separately
html = html.replace(/\s+style="width:\d+%"/g, '');

// 2. Replace style="width:XX%" on .vote-bar-fill against
const widthAgainstRegex =
  /class="([^"]*vote-bar-fill against[^"]*)"\s+style="width:(\d+)%"/g;
html = html.replace(widthAgainstRegex, (match, classes, width) => {
  widths.add(width);
  return `class="${classes} width-${width}"`;
});

// Remove style for against as well
html = html.replace(/\s+style="width:\d+%"/g, '');

// 3. Add type="button" to all <button> that do not have type attribute and are not submit buttons
html = html.replace(
  /<button([^>]*?)(?<!type="submit")((?<!type="button")(?<!type='button'))>/g,
  (match, attrs) => {
    // If already has type, skip
    if (/type\s*=/.test(attrs)) return match;
    return `<button${attrs} type="button">`;
  },
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(
  '✅ Updated governance.html: moved width inline styles to classes and added type="button" to buttons.',
);

// 4. Add width-XX classes to governance.css if not present
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf8');
  let newCss = '';
  widths.forEach((width) => {
    const className = `.width-${width}`;
    if (!css.includes(className)) {
      newCss += `\n${className} { width: ${width}%; }`;
    }
  });
  if (newCss) {
    css += '\n/* Auto-generated width classes for vote bars */' + newCss + '\n';
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log('✅ Updated governance.css: added width-XX classes.');
  } else {
    console.log('No new width classes needed in governance.css.');
  }
} else {
  console.warn(
    '⚠️ governance.css not found. Please add width-XX classes manually.',
  );
}
