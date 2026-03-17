jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-onesignal', () => ({
  setAppId: jest.fn(),
  promptForPushNotificationsWithUserResponse: jest.fn(),
  setNotificationOpenedHandler: jest.fn(),
}), {virtual: true});

jest.mock('@walletconnect/react-native-compat', () => ({
  Web3Modal: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
  })),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
  hasString: jest.fn().mockResolvedValue(false),
}));

jest.mock('@react-native-firebase/analytics', () =>
  jest.fn(() => ({
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
  })),
);

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    NavigationContainer: ({children, testID}) =>
      React.createElement(View, {testID}, children),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    createBottomTabNavigator: () => ({
      Navigator: ({children}) => React.createElement(View, null, children),
      Screen: () => null,
    }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaConsumer: ({children}) =>
      children({top: 0, right: 0, bottom: 0, left: 0}),
    SafeAreaView: ({children}) => children,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
    useSafeAreaFrame: () => ({x: 0, y: 0, width: 0, height: 0}),
  };
});

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

if (typeof global.setImmediate !== 'function') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}

if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = handle => clearTimeout(handle);
}
