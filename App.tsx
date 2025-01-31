import './src/utils/crypto-setup';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider } from './src/contexts/WalletContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <SettingsProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </SettingsProvider>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
