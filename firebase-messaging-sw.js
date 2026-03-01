// [Firebase Messaging Service Worker]
// Replace the below with your Firebase config and messagingSenderId
importScripts(
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js',
);

firebase.initializeApp({
  apiKey: 'AIzaSyAKUDrkUndC4WEm7Cm2GLaq6Ry14u4Ta4Y',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'aetheron-platform',
  storageBucket: 'aetheron-platform.firebasestorage.app',
  messagingSenderId: '447432569589',
  appId: '1:447432569589:android:37eeb026e6f2102f878bbc',
  measurementId: '526406471',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo-192.png',
  });
});
