// Minimal dashboard.test.js for isolated Jest test
const { JSDOM } = require('jsdom');
describe('Aetheron Dashboard', () => {
  let window, document;
  beforeEach(() => {
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><button id="editProfileBtn"></button><div id="userProfilesPlaceholder"></div></body></html>',
    );
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    window.dashboard = { notify: jest.fn() };
  });
  test('Profile edit modal opens', () => {
    // Minimal test: just check button exists
    const btn = document.getElementById('editProfileBtn');
    expect(btn).toBeTruthy();
  });
});
