import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ImportXPubScreen from '../screens/ImportXPubScreen';
import { useWallet } from '../contexts/WalletContext';
import TransactionsScreen from '../screens/TransactionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  ImportXPub: undefined;
  Transactions: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { state } = useWallet();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!state.xpubData ? (
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
                  backgroundColor: colors.background,
                },
                headerTintColor: colors.text.primary,
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 