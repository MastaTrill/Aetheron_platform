// Push notification button logic
import { requestNotificationPermission } from './firebase-messaging-init.js';

function isPushNotificationsConfigured() {
  return Boolean(
    typeof window.AETHERON_FIREBASE_CONFIG === 'object' &&
      window.AETHERON_FIREBASE_CONFIG !== null &&
      window.AETHERON_FIREBASE_CONFIG.apiKey &&
      window.AETHERON_FIREBASE_CONFIG.projectId &&
      typeof window.AETHERON_FIREBASE_VAPID_KEY === 'string' &&
      window.AETHERON_FIREBASE_VAPID_KEY.trim(),
  );
}

function setNotificationsMessage(message) {
  const placeholder = document.getElementById('notificationsPlaceholder');
  if (placeholder) {
    placeholder.textContent = message;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('enablePushBtn');
  if (!btn) {
    return;
  }

  if (!isPushNotificationsConfigured()) {
    btn.disabled = true;
    btn.title = 'Push notifications are not configured for this deployment.';
    setNotificationsMessage(
      'Push notifications are not configured for this deployment yet.',
    );
    return;
  }

  btn.addEventListener('click', async function () {
    try {
      const result = await requestNotificationPermission();
      if (result.permission === 'granted') {
        setNotificationsMessage(
          result.token
            ? 'Push notifications enabled successfully.'
            : 'Push permission granted, but no token was returned.',
        );
        return;
      }

      setNotificationsMessage(
        'Push notification permission was not granted.',
      );
    } catch (error) {
      console.warn('Push notification setup failed:', error);
      setNotificationsMessage(
        'Push notifications could not be enabled from this deployment.',
      );
    }
  });
});
