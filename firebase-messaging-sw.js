// [Firebase Messaging Service Worker]
// Replace the below with your Firebase config and messagingSenderId
importScripts(
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js'
);

// SECURITY: API key removed 2026-10-17 after public secret-scanning alert #1 (publicly leaked since 2026-03-01).
// Restore from Google Cloud Console > APIs & Services > Credentials, restricted to this origin only.
// Do NOT commit live keys to the repo again.
const firebaseConfig = {
  apiKey: '',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'aetheron-platform',
  storageBucket: 'aetheron-platform.firebasestorage.app',
  messagingSenderId: '447432569589',
  appId: '1:447432569589:android:37eeb026e6f2102f878bbc'
  // measurementId: '526406471'
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo-192.png'
  });
});
