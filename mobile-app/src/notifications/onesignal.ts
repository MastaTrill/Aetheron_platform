import {OneSignal} from 'react-native-onesignal';

export function initializeNotifications() {
  // Replace with your OneSignal App ID before production push delivery is enabled.
  OneSignal.initialize('YOUR_ONESIGNAL_APP_ID');

  // Prompt for push permission, with settings fallback where supported.
  void OneSignal.Notifications.requestPermission(true);

  OneSignal.Notifications.addEventListener('click', event => {
    // You can handle navigation or analytics here.
    console.log('Notification opened:', event);
  });
}
