import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, 'governance.html');

let html = fs.readFileSync(htmlPath, 'utf8');
console.log('Original length:', html.length);
console.log('HTML starts with:', html.substring(0, 100));

const index = html.indexOf('vote-bar-fill');
console.log('Index of vote-bar-fill:', index);
if (index !== -1) {
  console.log('Text around:', html.substring(index - 10, index + 50));
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Written to', htmlPath);

fs.writeFileSync('test-output.html', html, 'utf8');
console.log('Written to test-output.html');
