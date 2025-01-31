import React from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';

export default function SettingsScreen() {
  const { dispatch: walletDispatch } = useWallet();

  const handleReset = () => {
    Alert.alert(
      'Reset Wallet',
      'Are you sure you want to remove the xpub and all wallet data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.removeXPubData();
              walletDispatch({ type: 'RESET' });
            } catch (error) {
              Alert.alert('Error', 'Failed to reset wallet data');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Button
          title="Reset Wallet"
          onPress={handleReset}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
}); 