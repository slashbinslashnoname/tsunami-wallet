import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider } from './contexts/WalletContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <SettingsProvider>
            <WalletProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </WalletProvider>
          </SettingsProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 