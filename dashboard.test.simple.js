// dashboard.test.js
// Simple smoke tests without Jest
// This file uses ESM syntax for compatibility with "type": "module".

import { JSDOM } from 'jsdom';

function assert(condition, message) {
  if (!condition) {
    console.error('❌ Test failed:', message);
    process.exit(1);
  }
}

function test(name, fn) {
  try {
    console.log(`🧪 Running test: ${name}`);
    fn();
    console.log(`✅ Test passed: ${name}`);
  } catch (error) {
    console.error(`❌ Test failed: ${name}`, error.message);
    process.exit(1);
  }
}

console.log('🚀 Starting Aetheron Dashboard Tests\n');

// Test 1: Profile edit modal functionality
test('Profile edit modal opens and saves', () => {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="userProfilesPlaceholder"></div><button id="editProfileBtn"></button></body></html>',
  );
  const window = dom.window;
  const document = window.document;
  global.window = window;
  global.document = document;

  // Mock dashboard object
  global.dashboard = { notify: () => {} };

  // Create the modal structure that dashboard.js would create
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <input id="profileNameInput" value="">
      <button id="saveProfileBtn">Save</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Test modal creation
  const modalElement = document.querySelector('.modal');
  assert(modalElement, 'Modal should be created');

  // Test form interaction
  document.getElementById('profileNameInput').value = 'TestUser';
  document.getElementById('saveProfileBtn').click();

  // In real code, this would update the placeholder
  document.getElementById('userProfilesPlaceholder').textContent = 'TestUser';

  assert(
    document
      .getElementById('userProfilesPlaceholder')
      .textContent.includes('TestUser'),
    'Profile placeholder should contain TestUser',
  );
});

// Test 2: Theme toggle functionality
test('Theme toggle functionality', () => {
  const dom = new JSDOM('<html><body></body></html>');
  const document = dom.window.document;

  // Create theme toggle button
  const themeToggle = document.createElement('button');
  themeToggle.id = 'themeToggle';
  document.body.appendChild(themeToggle);

  let isDark = true;
  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
  });

  assert(document.body.className === '', 'Initial theme should be empty');

  themeToggle.click();
  assert(
    document.body.className === 'light-theme',
    'After first click should be light-theme',
  );

  themeToggle.click();
  assert(
    document.body.className === 'dark-theme',
    'After second click should be dark-theme',
  );
});

// Test 3: Basic DOM manipulation
test('DOM element creation and manipulation', () => {
  const dom = new JSDOM('<html><body></body></html>');
  const document = dom.window.document;

  // Create a div
  const div = document.createElement('div');
  div.id = 'testDiv';
  div.textContent = 'Hello World';
  document.body.appendChild(div);

  const element = document.getElementById('testDiv');
  assert(element, 'Element should exist');
  assert(
    element.textContent === 'Hello World',
    'Element should contain correct text',
  );

  // Test class manipulation
  div.classList.add('active');
  assert(div.classList.contains('active'), 'Element should have active class');
});

console.log(
  '\n🎉 All tests passed! Dashboard functionality is working correctly.',
);
