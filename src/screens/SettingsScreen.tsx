import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { colors, spacing, typography, shadows } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AddressService } from '../services/address';
import { formatAddress } from '../utils/bitcoin';
import { useThemeMode } from '../contexts/ThemeContext';
import i18n from '../i18n';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;

  const { state: walletState, dispatch: walletDispatch } = useWallet();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [nextAddress, setNextAddress] = useState('No address');
  const [currentAddress, setCurrentAddress] = useState('No address');
  const [showSeed, setShowSeed] = useState(false);

  const { settings, updateCurrency } = useSettings();

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

  const handleThemePress = () => {
    Alert.alert(
      'Theme Settings',
      'Choose your preferred theme',
      [
        {
          text: 'Light',
          onPress: () => setThemeMode('light'),
          style: themeMode === 'light' ? 'destructive' : 'default',
        },
        {
          text: 'Dark',
          onPress: () => setThemeMode('dark'),
          style: themeMode === 'dark' ? 'destructive' : 'default',
        },
        {
          text: 'System',
          onPress: () => setThemeMode('system'),
          style: themeMode === 'system' ? 'destructive' : 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleExportSeed = () => {
    if (!walletState.mnemonic) {
      Alert.alert(i18n.t('settings.noSeedStored'));
      return;
    }

    Alert.alert(
      i18n.t('settings.exportSeed'),
      i18n.t('settings.confirmExport'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { 
          text: i18n.t('common.confirm'),
          onPress: () => setShowSeed(true)
        }
      ]
    );
  };

  const handleCopySeed = () => {
    // Implementation of handleCopySeed function
  };

  const handleCurrencyPress = () => {
    Alert.alert(
      i18n.t('settings.currency'),
      i18n.t('settings.selectCurrency'),
      [
        {
          text: 'BTC',
          onPress: () => updateCurrency('BTC'),
          style: settings.currency === 'BTC' ? 'destructive' : 'default',
        },
        {
          text: 'USD',
          onPress: () => updateCurrency('USD'),
          style: settings.currency === 'USD' ? 'destructive' : 'default',
        },
        {
          text: 'EUR',
          onPress: () => updateCurrency('EUR'),
          style: settings.currency === 'EUR' ? 'destructive' : 'default',
        },
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
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
    {
      icon: 'theme-light-dark',
      title: 'Theme',
      subtitle: themeMode === 'system' 
        ? 'System Default' 
        : themeMode === 'dark' 
          ? 'Dark Mode' 
          : 'Light Mode',
      onPress: handleThemePress,
      showChevron: true
    },
    {
      icon: 'currency-btc',
      title: i18n.t('settings.currency'),
      subtitle: settings.currency,
      onPress: handleCurrencyPress,
      showChevron: true
    },
    {
      icon: 'key',
      title: i18n.t('settings.exportSeed'),
      onPress: handleExportSeed,
      showChevron: true
    },

  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
      padding: spacing.md,
    },
    title: {
      ...typography(currentTheme).heading,
      marginBottom: spacing.lg,
    },
    section: {
      backgroundColor: currentTheme.card.background,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows(currentTheme).medium,
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
      ...typography(currentTheme).body,
      marginLeft: spacing.md,
    },
    settingSubtext: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginTop: spacing.xs,
      marginLeft: spacing.md,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    seedContainer: {
      backgroundColor: currentTheme.surface,
      padding: spacing.md,
      borderRadius: 8,
      marginTop: spacing.sm,
    },
    seedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    seedText: {
      ...typography(currentTheme).body,
      color: currentTheme.text.primary,
      flex: 1,
    },
    copyButton: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
    },
  });

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
                      color={currentTheme.text.primary} 
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
                      color={themeMode === 'dark' ? colors.dark.text.secondary : colors.light.text.secondary} 
                    />
                  )}
                </TouchableOpacity>
              ))}
               {showSeed && walletState.mnemonic && (
              <View style={styles.seedContainer}>
                <View style={styles.seedRow}>
                  <Text style={styles.seedText}>{walletState.mnemonic}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={handleCopySeed}
                  >
                    <MaterialCommunityIcons 
                      name="content-copy" 
                      size={20} 
                      color={currentTheme.text.secondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
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