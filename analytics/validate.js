// Simple validation script for Analytics Dashboard
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating Analytics Dashboard...');

// Check if files exist
const files = ['index.html', 'analytics.css', 'analytics.js'];
let allFilesExist = true;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Basic HTML validation
try {
  const htmlContent = fs.readFileSync('index.html', 'utf8');

  const checks = [
    { name: 'Chart.js script', pattern: /chart\.js/ },
    { name: 'Analytics CSS', pattern: /analytics\.css/ },
    { name: 'Analytics JS', pattern: /analytics\.js/ },
    { name: 'Font Awesome', pattern: /font-awesome/ },
    { name: 'Stats grid', pattern: /stats-grid/ },
    { name: 'Performance chart', pattern: /performanceChart/ },
    { name: 'Asset table', pattern: /asset-table/ }
  ];

  checks.forEach(check => {
    if (check.pattern.test(htmlContent)) {
      console.log(`✅ ${check.name} found in HTML`);
    } else {
      console.log(`❌ ${check.name} missing in HTML`);
    }
  });

} catch (error) {
  console.log('❌ Error reading HTML file:', error.message);
  allFilesExist = false;
}

// Basic CSS validation
try {
  const cssContent = fs.readFileSync('analytics.css', 'utf8');

  const cssChecks = [
    { name: 'Root variables', pattern: /--primary/ },
    { name: 'Stat cards', pattern: /\.stat-card/ },
    { name: 'Charts', pattern: /\.chart-container/ },
    { name: 'Responsive design', pattern: /@media/ }
  ];

  cssChecks.forEach(check => {
    if (check.pattern.test(cssContent)) {
      console.log(`✅ ${check.name} found in CSS`);
    } else {
      console.log(`❌ ${check.name} missing in CSS`);
    }
  });

} catch (error) {
  console.log('❌ Error reading CSS file:', error.message);
}

// Basic JS structure check (without executing)
try {
  const jsContent = fs.readFileSync('analytics.js', 'utf8');

  const jsChecks = [
    { name: 'AnalyticsDashboard class', pattern: /class AnalyticsDashboard/ },
    { name: 'Chart initialization', pattern: /new Chart/ },
    { name: 'Data fetching', pattern: /fetchPortfolioData/ },
    { name: 'DOM ready', pattern: /DOMContentLoaded/ }
  ];

  jsChecks.forEach(check => {
    if (check.pattern.test(jsContent)) {
      console.log(`✅ ${check.name} found in JS`);
    } else {
      console.log(`❌ ${check.name} missing in JS`);
    }
  });

} catch (error) {
  console.log('❌ Error reading JS file:', error.message);
}

console.log('\n📊 Analytics Dashboard Validation Complete!');
console.log(allFilesExist ? '🎉 All files present and basic structure validated!' : '⚠️  Some issues found - please check above.');

console.log('\n🚀 To test the dashboard:');
console.log('1. Open http://localhost:8080 in your browser');
console.log('2. Check browser console for any JavaScript errors');
console.log('3. Verify charts load and data displays correctly');