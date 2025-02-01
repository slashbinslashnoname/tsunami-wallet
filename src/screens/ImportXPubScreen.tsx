import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { XPubService } from '../services/xpub';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { BitcoinIllustration } from '../components/BitcoinIllustration';
import { AddressService } from '../services/address';
import { useThemeMode } from '../contexts/ThemeContext';
import { colors } from '../theme';
import i18n from '../i18n';

export default function ImportXPubScreen() {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;
  const [xpubInput, setXpubInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useWallet();

  async function handleImport() {
    setIsLoading(true);
    try {
      if (XPubService.validateFormat(xpubInput.trim())) {
        const xpubData = XPubService.parseXPub(xpubInput.trim());
        await StorageService.saveXPubData(xpubData);
        dispatch({ type: 'SET_XPUB', payload: xpubData });
      } else if (XPubService.validateMnemonic(xpubInput.trim())) {
        const xpub = await XPubService.mnemonicToXpub(xpubInput.trim());
        const xpubData = {
          xpub,
          format: AddressService.detectXpubFormat(xpub),
          network: 'mainnet' as const,
          derivationPath: "m/84'/0'/0'"
        };
        dispatch({ type: 'SET_XPUB', payload: xpubData });
      } else {
        throw new Error(i18n.t('import.invalidInput'));
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'REFRESH' });
    } catch (error) {
      Alert.alert(
        i18n.t('common.error'), 
        error instanceof Error ? error.message : i18n.t('common.error')
      );
    } finally {
      setIsLoading(false);
    }
  }

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
                title={i18n.t('import.import')}
                onPress={handleImport}
                isLoading={isLoading}
                disabled={!XPubService.validateFormat(xpubInput.trim())}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

