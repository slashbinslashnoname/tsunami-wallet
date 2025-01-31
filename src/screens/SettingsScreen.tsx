import React from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { dispatch: walletDispatch } = useWallet();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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

  const settingsItems = [
    {
      icon: 'bell-outline',
      title: 'Activity',
      onPress: () => navigation.navigate('Activity'),
      showChevron: true
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <View style={styles.settingContent}>
              <MaterialCommunityIcons 
                name={item.icon as any} 
                size={24} 
                color={colors.text.primary} 
              />
              <Text style={styles.settingText}>{item.title}</Text>
            </View>
            {item.showChevron && (
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={colors.text.secondary} 
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...typography.body,
    marginLeft: spacing.md,
  },
}); 