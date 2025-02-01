import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ImportXPubScreen from '../screens/ImportXPubScreen';
import { useWallet } from '../contexts/WalletContext';
import TransactionsScreen from '../screens/TransactionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';
import { ActivityScreen } from '../screens/ActivityScreen';
import { useThemeMode, ThemeProvider } from '../contexts/ThemeContext';

export type RootStackParamList = {
  Home: undefined;
  ImportXPub: undefined;
  Transactions: undefined;
  Settings: undefined;
  Activity: undefined;
  Loading: undefined;
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
  const { state } = useWallet();
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;

  return (
    <Stack.Navigator>
      {!state.xpubData || state.isLoading ? (
        <Stack.Screen 
          name="ImportXPub" 
          component={ImportXPubScreen} 
          options={{ headerShown: false }} 
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
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
                backgroundColor: theme.background,
              },
              headerTintColor: theme.text.primary,
            }} 
          />
          <Stack.Screen 
            name="Activity" 
            component={ActivityScreen}
            options={{
              headerShown: true,
              title: 'Activity',
              headerStyle: {
                backgroundColor: theme.background,
              },
              headerTintColor: theme.text.primary
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
} 