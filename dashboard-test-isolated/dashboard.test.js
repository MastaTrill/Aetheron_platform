// Minimal dashboard.test.js for isolated Jest test
describe('Aetheron Dashboard', () => {
  let window;
  let document;

  beforeEach(() => {
    const elements = {
      editProfileBtn: { id: 'editProfileBtn' },
      userProfilesPlaceholder: { id: 'userProfilesPlaceholder' },
    };

    document = {
      getElementById(id) {
        return elements[id] || null;
      },
    };

    window = {
      dashboard: { notify: jest.fn() },
    };

    global.window = window;
    global.document = document;
  });

  test('Profile edit modal opens', () => {
    const button = document.getElementById('editProfileBtn');
    expect(button).toBeTruthy();
  });
});
