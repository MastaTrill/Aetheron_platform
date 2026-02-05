/* eslint-disable react/no-unstable-nested-components */
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, Text} from 'react-native';
import {Web3Provider} from './src/context/Web3Context';
import {
  HomeScreen,
  SocialTradingScreen,
  YieldAggregatorScreen,
  NFTIntegrationScreen,
  AnalyticsScreen,
} from './src/screens';
import {initializeNotifications} from './src/notifications/onesignal';
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
            name="Dashboard"
            component={HomeScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Dashboard Tab">
                  📊
                </Text>
              ),
              title: 'Dashboard',
            }}
          />
          <Tab.Screen
            name="Social"
            component={SocialTradingScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Social Tab">
                  👥
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Yield"
            component={YieldAggregatorScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Yield Tab">
                  📈
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="NFT"
            component={NFTIntegrationScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="NFT Tab">
                  🎨
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Text style={{fontSize: 24, color}} accessible accessibilityLabel="Analytics Tab">
                  📊
                </Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </Web3Provider>
  );
}

export default App;
