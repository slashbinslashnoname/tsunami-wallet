import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ImportXPubScreen from '../screens/ImportXPubScreen';
import CreateWalletScreen from '../screens/CreateWalletScreen';
import { useWallet } from '../contexts/WalletContext';
import TransactionsScreen from '../screens/TransactionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';
import { ActivityScreen } from '../screens/ActivityScreen';
import { useThemeMode, ThemeProvider } from '../contexts/ThemeContext';
import LoadingScreen from '../screens/LoadingScreen';
import SendScreen from '../screens/SendScreen';

export type RootStackParamList = {
  Home: undefined;
  ImportXPub: undefined;
  CreateWallet: undefined;
  Transactions: undefined;
  Settings: undefined;
  Activity: undefined;
  Loading: undefined;
  Send: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}

function MainNavigator() {
  const { state, dispatch } = useWallet();
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;

  useEffect(() => {
    if (state.xpubData) {
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: 'SET_LOADING', payload: false });

  }, [state.xpubData])

  return (
    <Stack.Navigator>
      {state.isLoading ? (
        <Stack.Screen 
          name="Loading" 
          component={LoadingScreen} 
          options={{ headerShown: false }} 
        />
      ) : !state.xpubData ? (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="ImportXPub" 
            component={ImportXPubScreen} 
            options={{ 
              headerShown: true,
              title: 'Import Watch-only Wallet',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary,
            }} 
          />
          <Stack.Screen 
            name="CreateWallet" 
            component={CreateWalletScreen} 
            options={{ 
              headerShown: true,
              title: 'Create Wallet',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary,
            }} 
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="CreateWallet" 
            component={CreateWalletScreen} 
            options={{ 
              headerShown: true,
              title: 'Create Wallet',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary,
            }} 
          />
          <Stack.Screen 
            name="ImportXPub" 
            component={ImportXPubScreen} 
            options={{ 
              headerShown: true,
              title: 'Import Watch-only Wallet',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary,
            }} 
          />
          <Stack.Screen 
            name="Transactions" 
            component={TransactionsScreen} 
            options={{ 
              headerShown: false // We're handling the header in the component
            }} 
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ 
              headerShown: true,
              title: 'Settings',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary,
            }} 
          />
          <Stack.Screen 
            name="Activity" 
            component={ActivityScreen}
            options={{
              headerShown: true,
              title: 'Activity',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary
            }}
          />
          <Stack.Screen 
            name="Send" 
            component={SendScreen} 
            options={{ 
              headerShown: true,
              title: 'Send Bitcoin',
              headerStyle: {
                backgroundColor: currentTheme.background,
              },
              headerTintColor: currentTheme.text.primary,
            }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
} 