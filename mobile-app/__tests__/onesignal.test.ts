import {OneSignal} from 'react-native-onesignal';
import {initializeNotifications} from '../src/notifications/onesignal';

test('initializes OneSignal through the supported v5 API', () => {
  initializeNotifications();

  expect(OneSignal.initialize).toHaveBeenCalledWith('YOUR_ONESIGNAL_APP_ID');
  expect(OneSignal.Notifications.requestPermission).toHaveBeenCalledWith(true);
  expect(OneSignal.Notifications.addEventListener).toHaveBeenCalledWith(
    'click',
    expect.any(Function),
  );
});
