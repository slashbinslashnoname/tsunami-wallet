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

export default function ImportXPubScreen() {
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
        throw new Error('Invalid xpub or mnemonic');
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'REFRESH' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  function handleScanSuccess(e: { data: string }) {
    setXpubInput(e.data);
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
            <Text style={styles.subtitle}>Import xpub/ypub/zpub or mnemonic</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter xpub/ypub/zpub or mnemonic"
              value={xpubInput}
              onChangeText={setXpubInput}
              multiline
              autoCapitalize="none"
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Import"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
}); 
