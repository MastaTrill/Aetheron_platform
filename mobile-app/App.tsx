import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, Text} from 'react-native';
import {Web3Provider} from './src/context/Web3Context';
import {HomeScreen, WalletScreen, StakingScreen, SwapScreen} from './src/screens';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { initializeNotifications } from './src/notifications/onesignal';
import {theme} from './src/config/theme';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  useEffect(() => {
    initializeNotifications();
  }, []);
  return (
    <Web3Provider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.card,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
          }}>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Home Tab">🏠</Text>
              ),
              title: 'Aetheron',
            }}
          />
          <Tab.Screen
            name="Wallet"
            component={WalletScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Wallet Tab">💼</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Activity"
            component={ActivityScreen}
          />
          <Tab.Screen
            name="Staking"
            component={StakingScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Staking Tab">🎯</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Swap"
            component={SwapScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Swap Tab">🔄</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </Web3Provider>
  );
}

export default App;
