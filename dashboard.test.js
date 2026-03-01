// dashboard.test.js
// Basic unit tests for dashboard.js user settings, notifications, onboarding

const { JSDOM } = require('jsdom');

describe('Aetheron Dashboard', () => {
  let window, document;
  beforeEach(() => {
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="userProfilesPlaceholder"></div><button id="editProfileBtn"></button></body></html>',
    );
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    // Mock notify
    window.dashboard = { notify: jest.fn() };
  });

  test('Profile edit modal opens and saves', () => {
    require('./dashboard.js');
    const btn = document.getElementById('editProfileBtn');
    btn.click();
    const modal = document.querySelector('.modal');
    expect(modal).toBeTruthy();
    document.getElementById('profileNameInput').value = 'TestUser';
    document.getElementById('saveProfileBtn').click();
    expect(
      document.getElementById('userProfilesPlaceholder').textContent,
    ).toContain('TestUser');
    expect(window.dashboard.notify).toHaveBeenCalledWith(
      'Profile updated!',
      'success',
    );
  });

  // Add more tests for notifications, onboarding, accessibility, etc.
});
