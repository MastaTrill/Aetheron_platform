// fix-governance-inline.js
// Usage: node fix-governance-inline.js
// This script replaces all style="width:XX%" on .vote-bar-fill with class="vote-bar-fill width-XX" and removes the style attribute.
// It also adds type="button" to all non-submit <button> elements.
// Place this script in the same folder as governance.html and run it with Node.js.

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'governance.html');
const cssPath = path.join(__dirname, 'governance.css');

let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Replace style="width:XX%" on .vote-bar-fill with class width-XX
const widthRegex = /(<div class="vote-bar-fill(?:[^"]*)?)" style="width:(\d+)%"/g;
let widths = new Set();
html = html.replace(widthRegex, (match, pre, width) => {
  widths.add(width);
  return `${pre} width-${width}"`;
});

// 2. Replace style="width:XX%" on .vote-bar-fill against
const widthAgainstRegex = /(<div class="vote-bar-fill against(?:[^"]*)?)" style="width:(\d+)%"/g;
html = html.replace(widthAgainstRegex, (match, pre, width) => {
  widths.add(width);
  return `${pre} width-${width}"`;
});

// 3. Add type="button" to all <button> that do not have type attribute and are not submit buttons
html = html.replace(/<button([^>]*?)(?<!type="submit")((?<!type="button")(?<!type='button'))>/g, (match, attrs) => {
  // If already has type, skip
  if (/type\s*=/.test(attrs)) return match;
  return `<button${attrs} type="button">`;
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ Updated governance.html: moved width inline styles to classes and added type="button" to buttons.');

// 4. Add width-XX classes to governance.css if not present
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf8');
  let newCss = '';
  widths.forEach(width => {
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
  console.warn('⚠️ governance.css not found. Please add width-XX classes manually.');
}
