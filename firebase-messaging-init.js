function getFirebaseMessagingConfig() {
  const config =
    typeof window.AETHERON_FIREBASE_CONFIG === 'object' &&
    window.AETHERON_FIREBASE_CONFIG !== null
      ? window.AETHERON_FIREBASE_CONFIG
      : null;
  const vapidKey =
    typeof window.AETHERON_FIREBASE_VAPID_KEY === 'string'
      ? window.AETHERON_FIREBASE_VAPID_KEY.trim()
      : '';

  if (!config || !config.apiKey || !config.projectId || !vapidKey) {
    return null;
  }

  return { config, vapidKey };
}

async function loadFirebaseMessagingSdk() {
  const [appModule, messagingModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js'),
    import('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js'),
  ]);

  return {
    initializeApp: appModule.initializeApp,
    getMessaging: messagingModule.getMessaging,
    getToken: messagingModule.getToken,
    onMessage: messagingModule.onMessage,
  };
}

let messageListenerBound = false;

export async function requestNotificationPermission() {
  const firebaseMessaging = getFirebaseMessagingConfig();
  if (!firebaseMessaging) {
    throw new Error('Push notifications are not configured for this deployment.');
  }

  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { permission, token: null };
  }

  const { initializeApp, getMessaging, getToken, onMessage } =
    await loadFirebaseMessagingSdk();
  const app = initializeApp(firebaseMessaging.config);
  const messaging = getMessaging(app);

  if (!messageListenerBound) {
    onMessage(messaging, function (payload) {
      alert(
        `Push notification: ${payload.notification.title}\n${payload.notification.body}`,
      );
    });
    messageListenerBound = true;
  }

  const token = await getToken(messaging, {
    vapidKey: firebaseMessaging.vapidKey,
    serviceWorkerRegistration: window.navigator.serviceWorker,
  }).catch(function (error) {
    console.warn('An error occurred while retrieving token.', error);
    return null;
  });

  return { permission, token };
}
