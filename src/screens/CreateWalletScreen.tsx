import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useWallet } from '../contexts/WalletContext';
import { WalletService } from '../services/wallet';
import { StorageService } from '../services/storage';
import { SeedVerification } from '../components/SeedVerification';
import { spacing, typography, colors } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';

enum Step {
  GENERATE = 'generate',
  DISPLAY = 'display',
  VERIFY = 'verify',
  COMPLETE = 'complete'
}

export default function CreateWalletScreen({ navigation }: any) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const { dispatch } = useWallet();
  
  const [step, setStep] = useState<Step>(Step.GENERATE);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [importMnemonic, setImportMnemonic] = useState<string>('');
  const [addressType, setAddressType] = useState<'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh'>('p2wpkh');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verificationComplete, setVerificationComplete] = useState<boolean>(false);
  
  // Generate mnemonic when component mounts
  useEffect(() => {
    generateMnemonic();
  }, []);
  
  const generateMnemonic = () => {
    try {
      setIsLoading(true);
      const newMnemonic = WalletService.generateMnemonic();
      setMnemonic(newMnemonic);
      setStep(Step.DISPLAY);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate wallet: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyMnemonic = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Copied', 'Recovery phrase copied to clipboard. Keep it secure!');
  };
  
  const handleVerificationComplete = () => {
    setVerificationComplete(true);
  };
  
  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      
      // Derive keys from mnemonic
      const xpubData = await WalletService.deriveKeysFromMnemonic(mnemonic);
      
      // Save wallet data
      await StorageService.saveXPubData(xpubData);
      
      // Update wallet state
      dispatch({ type: 'SET_XPUB', payload: xpubData });
      dispatch({ type: 'SET_MNEMONIC', payload: mnemonic });
      dispatch({ type: 'SET_HAS_FULL_WALLET', payload: true });
      
      // Navigate to home screen
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create wallet: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImportMnemonicChange = (text: string) => {
    setImportMnemonic(text);
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 3,
    },
    header: {
      ...typography(currentTheme).heading,
      marginBottom: spacing.md,
    },
    subheader: {
      ...typography(currentTheme).subheading,
      marginBottom: spacing.xl,
      color: currentTheme.text.secondary,
    },
    mnemonicContainer: {
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: 12,
      marginVertical: spacing.lg,
    },
    mnemonicText: {
      ...typography(currentTheme).body,
      lineHeight: 28,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    importInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: 8,
      padding: spacing.md,
      height: 120,
      textAlignVertical: 'top',
      color: currentTheme.text.primary,
      marginBottom: spacing.lg,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    warningContainer: {
      backgroundColor: currentTheme.warning,
      padding: spacing.md,
      borderRadius: 8,
      marginBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningText: {
      ...typography(currentTheme).body,
      color: '#FFFFFF',
      marginLeft: spacing.sm,
      flex: 1,
    },
    buttonContainer: {
      marginTop: spacing.lg,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.secondary,
      padding: spacing.sm,
      borderRadius: 8,
      marginTop: spacing.md,
    },
    copyButtonText: {
      ...typography(currentTheme).body,
      color: currentTheme.white,
      marginLeft: spacing.sm,
    },
    optionsContainer: {
      marginBottom: spacing.lg,
    },
    optionTitle: {
      ...typography(currentTheme).subheading,
      marginBottom: spacing.sm,
    },
    optionRow: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    optionButton: {
      flex: 1,
      backgroundColor: currentTheme.card,
      padding: spacing.md,
      borderRadius: 8,
      marginRight: spacing.md,
      borderWidth: 2,
      alignItems: 'center',
    },
    selectedOption: {
      borderColor: currentTheme.primary,
    },
    lastOption: {
      marginRight: 0,
    },
    optionText: {
      ...typography(currentTheme).body,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    errorText: {
      ...typography(currentTheme).body,
      color: currentTheme.error,
      marginTop: spacing.md,
    },
    backButton: {
      marginTop: spacing.lg,
    },
    startOption: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    optionLabel: {
      ...typography(currentTheme).subheading,
      marginBottom: spacing.sm,
    },
    optionDescription: {
      ...typography(currentTheme).body,
      color: currentTheme.text.secondary,
    },
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      padding: spacing.xl,
    },
    successIcon: {
      marginBottom: spacing.xl,
    },
    successTitle: {
      ...typography(currentTheme).heading,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    successText: {
      ...typography(currentTheme).body,
      textAlign: 'center',
      marginBottom: spacing.xl,
      color: currentTheme.text.secondary,
    },
  });
  
  if (isLoading && step === Step.GENERATE) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
          <Text style={styles.successTitle}>Generating your wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (step === Step.DISPLAY) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.header}>Your Recovery Phrase</Text>
          <Text style={styles.subheader}>
            Write down these 24 words in order and keep them in a safe place. 
            This is the only way to recover your wallet if you lose access to your device.
          </Text>
          
          <View style={styles.warningContainer}>
            <MaterialCommunityIcons name="alert" size={24} color={currentTheme.error} />
            <Text style={styles.warningText}>
              Never share your recovery phrase with anyone. Anyone with these words can steal your funds.
            </Text>
          </View>
          
          <View style={styles.mnemonicContainer}>
            <Text style={styles.mnemonicText}>{mnemonic}</Text>
            
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={handleCopyMnemonic}
            >
              <MaterialCommunityIcons 
                name="content-copy" 
                size={18} 
                color={currentTheme.white} 
              />
              <Text style={styles.copyButtonText}>Copy to clipboard</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="I've written it down"
              onPress={() => setStep(Step.VERIFY)}
              style={styles.button}
            />
            <Button
              title="Generate new phrase"
              onPress={generateMnemonic}
              variant="secondary"
              style={styles.button}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  if (step === Step.VERIFY) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.header}>Verify Recovery Phrase</Text>
          <Text style={styles.subheader}>
            Let's make sure you've written down your recovery phrase correctly.
          </Text>
          
          <SeedVerification
            mnemonic={mnemonic}
            onComplete={handleVerificationComplete}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Create Wallet"
              onPress={handleCreateWallet}
              disabled={!verificationComplete || isLoading}
              isLoading={isLoading}
              style={styles.button}
            />
            <Button
              title="Back to Recovery Phrase"
              onPress={() => setStep(Step.DISPLAY)}
              variant="secondary"
              disabled={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.successContainer}>
        <MaterialCommunityIcons 
          name="check-circle" 
          size={80} 
          color={currentTheme.success} 
          style={styles.successIcon}
        />
        <Text style={styles.successTitle}>Wallet Created Successfully!</Text>
        <Text style={styles.successText}>
          Your Bitcoin wallet has been created and is ready to use. Remember to keep your recovery phrase safe.
        </Text>
        <Button
          title="Go to Wallet"
          onPress={() => navigation.replace('Home')}
        />
      </View>
    </SafeAreaView>
  );
}