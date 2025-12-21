import OneSignal from 'react-native-onesignal';

export function initializeNotifications() {
  // Replace with your OneSignal App ID
  OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');

  // Prompt for push on iOS
  OneSignal.promptForPushNotificationsWithUserResponse();

  // Notification opened handler
  OneSignal.setNotificationOpenedHandler(notification => {
    // You can handle navigation or analytics here
    console.log('Notification opened:', notification);
  });
}
