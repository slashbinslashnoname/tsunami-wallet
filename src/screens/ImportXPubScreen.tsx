import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Clipboard,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { XPubService } from '../services/xpub';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { BitcoinIllustration } from '../components/BitcoinIllustration';
import { AddressService } from '../services/address';
import { useThemeMode } from '../contexts/ThemeContext';
import { colors, spacing, typography } from '../theme';
import i18n from '../i18n';
import * as bip39 from 'bip39';
import { SeedVerification } from '../components/SeedVerification';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ImportXPubScreen() {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;
  const [xpubInput, setXpubInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useWallet();
  const [generatedSeed, setGeneratedSeed] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleImport() {
    setIsLoading(true);
    try {
      let xpubData;
      if (XPubService.validateFormat(xpubInput.trim())) {
        xpubData = XPubService.parseXPub(xpubInput.trim());
      } else if (XPubService.validateMnemonic(xpubInput.trim())) {
        const xpub = await XPubService.mnemonicToXpub(xpubInput.trim());
        xpubData = {
          xpub,
          format: 'zpub',
          network: 'mainnet' as const,
          derivationPath: "m/84'/0'/0'",
          mnemonic: xpubInput.trim()
        };
      } else {
        throw new Error(i18n.t('import.invalidInput'));
      }
      await StorageService.saveXPubData(xpubData);
      dispatch({ type: 'SET_XPUB', payload: xpubData });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'REFRESH' });
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error instanceof Error ? error.message : i18n.t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenerateSeed = () => {
    const mnemonic = bip39.generateMnemonic(128); // 12 words
    setGeneratedSeed(mnemonic);
  };

  const handleVerified = async () => {
    setIsLoading(true);
    try {
      const xpub = await XPubService.mnemonicToXpub(generatedSeed!);
      const xpubData = {
        xpub,
        format: AddressService.detectXpubFormat(xpub),
        network: 'mainnet' as const,
        derivationPath: "m/84'/0'/0'",
        mnemonic: generatedSeed
      };
      await StorageService.saveXPubData(xpubData);
      dispatch({ type: 'SET_XPUB', payload: xpubData });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'REFRESH' });
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error instanceof Error ? error.message : i18n.t('common.error'));
    } finally {
      setIsLoading(false);
      setGeneratedSeed(null);
      setIsVerifying(false);
    }
  };

  const handleCopySeed = async () => {
    await Clipboard.setStringAsync(generatedSeed!);
    Alert.alert(i18n.t('common.success'), i18n.t('import.seedCopied'));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      padding: 20,
      flex: 1,
      justifyContent: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      minHeight: 100,
      textAlignVertical: 'top',
      color: theme.text.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    centerText: {
      fontSize: 18,
      padding: 32,
      color: theme.text.secondary,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: theme.text.primary,
    },
    seedContainer: {
      backgroundColor: theme.surface,
      padding: spacing.md,
      borderRadius: 8,
      marginBottom: spacing.lg,
    },
    seedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    seedText: {
      ...typography(theme).body,
      color: theme.text.primary,
      flex: 1,
    },
    copyButton: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
    },
    warning: {
      ...typography(theme).caption,
      color: theme.warning,
      marginBottom: spacing.md,
    },
  }); 

  if (isVerifying && generatedSeed) {
    return (
      <SafeAreaView style={styles.container}>
        <SeedVerification
          seed={generatedSeed}
          onVerified={handleVerified}
          onCancel={() => {
            setGeneratedSeed(null);
            setIsVerifying(false);
          }}
        />
      </SafeAreaView>
    );
  }

  if (generatedSeed) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{i18n.t('import.backupSeed')}</Text>
          <Text style={styles.warning}>{i18n.t('import.seedWarning')}</Text>
          <View style={styles.seedContainer}>
            <View style={styles.seedRow}>
              <Text style={styles.seedText}>{generatedSeed}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopySeed}
              >
                <MaterialCommunityIcons 
                  name="content-copy" 
                  size={20} 
                  color={theme.text.secondary} 
                />
              </TouchableOpacity>
            </View>
            <Button
              title={i18n.t('import.verifySeed')}
              onPress={() => setIsVerifying(true)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          <BitcoinIllustration />
          <View style={styles.content}>
            <Text style={styles.title}>{i18n.t('import.title')}</Text>
            <TextInput
              style={styles.input}
              placeholder={i18n.t('import.placeholder')}
              placeholderTextColor={theme.text.secondary}
              value={xpubInput}
              onChangeText={setXpubInput}
              multiline
              autoCapitalize="none"
            />
            <View style={styles.buttonContainer}>
              <Button
                title={i18n.t('import.generateSeed')}
                onPress={handleGenerateSeed}
                variant="secondary"
                style={{ marginRight: spacing.sm }}
              />
              <Button
                title={i18n.t('import.import')}
                onPress={handleImport}
                isLoading={isLoading}
                disabled={!XPubService.validateFormat(xpubInput.trim()) && !XPubService.validateMnemonic(xpubInput.trim())}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

