import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AddressService } from '../services/address';
import { formatAddress } from '../utils/bitcoin';

export default function SettingsScreen() {
  const { state: walletState, dispatch: walletDispatch } = useWallet();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [nextAddress, setNextAddress] = useState('No address');
  const [currentAddress, setCurrentAddress] = useState('No address');

  useEffect(() => {
    async function loadNextAddress() {
      if (!walletState.xpubData) return;
      // current address is the address at the index - 1
      const addresses = await AddressService.deriveAddresses(walletState.xpubData, walletState.index-1, 1);
      setCurrentAddress(addresses[0].address);
      // next address is the address at the index
      const nextAddresses = await AddressService.deriveAddresses(walletState.xpubData, walletState.index, 1);
      setNextAddress(nextAddresses[0].address);
    }
    loadNextAddress();
    }, [walletState.xpubData, walletState.index]);

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
    {
      icon: 'key-outline',
      title: `Current Index: ${walletState.index}`,
      onPress: () => {},
      showChevron: false
    },
    {
      icon: 'wallet-outline',
      title: `Current Address :`,
      subtitle: formatAddress(currentAddress),
      onPress: () => {},
      showChevron: false
    },
    {
      icon: 'wallet-plus-outline',
      title: 'Next Address',
      subtitle: formatAddress(nextAddress),
      onPress: () => {},
      showChevron: false
    },
  ];


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
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
                    <View>
                      <Text style={styles.settingText}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.settingSubtext} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  settingSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginLeft: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});