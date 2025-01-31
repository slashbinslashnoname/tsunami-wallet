import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { XPubService } from '../services/xpub';
import { StorageService } from '../services/storage';
import { Button } from '../components/Button';
import { BitcoinIllustration } from '../components/BitcoinIllustration';

export default function ImportXPubScreen() {
  const [xpubInput, setXpubInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useWallet();

  async function handleImport() {
    setIsLoading(true);
    try {
      const xpubData = XPubService.parseXPub(xpubInput.trim());
      await StorageService.saveXPubData(xpubData);
      dispatch({ type: 'SET_XPUB', payload: xpubData });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'REFRESH' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  // Validate xpub
  const isValidXpub = XPubService.validateFormat(xpubInput.trim());

  return (
    <SafeAreaView style={styles.container}>
      <BitcoinIllustration />
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Enter xpub/ypub/zpub"
          value={xpubInput}
          onChangeText={setXpubInput}
          multiline
          autoCapitalize="none"
        />
        <Button
          title="Import"
          onPress={handleImport}
          isLoading={isLoading}
          disabled={!isValidXpub}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
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
}); 