// Push notification enable button logic
// Requires requestNotificationPermission from firebase-messaging-init.js
import { requestNotificationPermission } from './firebase-messaging-init.js';
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('enablePushBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      requestNotificationPermission();
    });
  }
});
