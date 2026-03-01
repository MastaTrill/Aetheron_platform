// [Firebase Messaging Frontend Init]
// Replace with your Firebase config
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js';
import {
  getMessaging,
  getToken,
  onMessage,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAKUDrkUndC4WEm7Cm2GLaq6Ry14u4Ta4Y',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'aetheron-platform',
  storageBucket: 'aetheron-platform.firebasestorage.app',
  messagingSenderId: '447432569589',
  appId: '1:447432569589:android:37eeb026e6f2102f878bbc',
  measurementId: '526406471',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export function requestNotificationPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      getToken(messaging, {
        vapidKey:
          'BBmvbrkKhMagY5SRi1FI-7CnrH4mvHmkIc94m8ph_b2GNsuRTOTZMUvSIKpMaRxqgsSg0l9lh-85ZHmkhLJcAAE',
        serviceWorkerRegistration: window.navigator.serviceWorker,
      })
        .then((currentToken) => {
          if (currentToken) {
            // Send token to server or use for push
            console.log('FCM Token:', currentToken);
          } else {
            console.warn(
              'No registration token available. Request permission to generate one.',
            );
          }
        })
        .catch((err) => {
          console.warn('An error occurred while retrieving token. ', err);
        });
    }
  });
}

onMessage(messaging, (payload) => {
  // Handle foreground push
  alert(
    `Push notification: ${payload.notification.title}\n${payload.notification.body}`,
  );
});
