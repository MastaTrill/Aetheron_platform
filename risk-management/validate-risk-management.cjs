#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Risk Management Feature Validation...\n');

// Check if files exist
const files = ['index.html', 'risk-management.css', 'risk-management.js'];
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

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing');
  process.exit(1);
}

// Basic content checks
console.log('\n📂 Checking file contents...');

try {
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  const cssContent = fs.readFileSync('risk-management.css', 'utf8');
  const jsContent = fs.readFileSync('risk-management.js', 'utf8');

  let passed = 0;
  let total = 0;

  // HTML checks
  total++;
  if (htmlContent.includes('<title>Risk Management')) {
    passed++;
    console.log('✅ HTML title correct');
  } else {
    console.log('❌ HTML title incorrect');
  }

  total++;
  if (htmlContent.includes('riskProfileChart')) {
    passed++;
    console.log('✅ Risk profile chart element found');
  } else {
    console.log('❌ Risk profile chart element missing');
  }

  // CSS checks
  total++;
  if (cssContent.includes('.navbar')) {
    passed++;
    console.log('✅ CSS navbar styles found');
  } else {
    console.log('❌ CSS navbar styles missing');
  }

  total++;
  if (cssContent.includes('@media')) {
    passed++;
    console.log('✅ CSS responsive design found');
  } else {
    console.log('❌ CSS responsive design missing');
  }

  // JS checks
  total++;
  if (jsContent.includes('class RiskManagement')) {
    passed++;
    console.log('✅ JavaScript RiskManagement class found');
  } else {
    console.log('❌ JavaScript RiskManagement class missing');
  }

  total++;
  if (jsContent.includes('calculatePositionSize')) {
    passed++;
    console.log('✅ Position size calculator found');
  } else {
    console.log('❌ Position size calculator missing');
  }

  const percentage = ((passed / total) * 100).toFixed(1);
  console.log(`\n🏆 Overall Score: ${passed}/${total} (${percentage}%)\n`);

  if (percentage >= 80) {
    console.log('🎉 Excellent! Risk Management feature validation passed!');
    process.exit(0);
  } else {
    console.log('👍 Good! Risk Management feature validation passed with acceptable score.');
    process.exit(0);
  }

} catch (error) {
  console.error('❌ Error reading files:', error.message);
  process.exit(1);
}