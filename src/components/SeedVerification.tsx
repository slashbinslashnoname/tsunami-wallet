import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Button } from './Button';
import { colors, spacing, shadows, typography } from '../theme';
import i18n from '../i18n';
import { useThemeMode } from '../contexts/ThemeContext';

interface Props {
  seed?: string;
  mnemonic?: string;
  onVerified?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

export function SeedVerification({ 
  seed, 
  mnemonic, 
  onVerified, 
  onCancel, 
  onComplete 
}: Props) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [wordArray, setWordArray] = useState<string[]>([]);
  const [verificationWords, setVerificationWords] = useState<{ index: number; word: string; input: string }[]>([]);
  const [allCorrect, setAllCorrect] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'full' | 'partial'>('full');

  // Detect verification mode based on props
  useEffect(() => {
    if (mnemonic && onComplete) {
      setVerificationMode('partial');
    } else {
      setVerificationMode('full');
    }
  }, [mnemonic, seed]);

  // Set up partial verification when mnemonic is provided
  useEffect(() => {
    if (mnemonic && verificationMode === 'partial') {
      const words = mnemonic.split(' ');
      setWordArray(words);
      
      // Select 3 random word indices for verification
      const indices = selectRandomIndices(words.length, 3);
      
      const verificationArray = indices.map(index => ({
        index,
        word: words[index],
        input: '',
      }));
      
      setVerificationWords(verificationArray);
    }
  }, [mnemonic, verificationMode]);

  // Check if all verification inputs are correct for partial verification
  useEffect(() => {
    if (verificationMode === 'partial') {
      const correct = verificationWords.every(item => 
        item.input.trim().toLowerCase() === item.word.toLowerCase()
      );
      
      setAllCorrect(correct && verificationWords.every(item => item.input.trim() !== ''));
      
      if (correct && verificationWords.every(item => item.input.trim() !== '') && onComplete) {
        onComplete();
      }
    }
  }, [verificationWords, verificationMode]);

  const selectRandomIndices = (max: number, count: number): number[] => {
    const indices = new Set<number>();
    
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * max));
    }
    
    return Array.from(indices).sort((a, b) => a - b);
  };
  
  const handleWordChange = (text: string, index: number) => {
    const updatedWords = [...verificationWords];
    updatedWords[index].input = text;
    setVerificationWords(updatedWords);
  };
  
  const getWordLabel = (index: number): string => {
    return `Word #${index + 1}`;
  };

  const handleVerify = () => {
    if (seed && input.trim().toLowerCase() === seed.toLowerCase()) {
      onVerified && onVerified();
    } else {
      setError(i18n.t('import.seedMismatch'));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '100%',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: currentTheme.text.primary,
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 20,
      color: currentTheme.text.secondary,
    },
    input: {
      width: '100%',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
      minHeight: 100,
      textAlignVertical: 'top',
      color: currentTheme.text.primary,
      backgroundColor: currentTheme.surface,
      ...shadows(currentTheme).medium,
    },
    error: {
      color: currentTheme.error,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      width: '100%',
    },
    // New styles for partial verification
    partialContainer: {
      marginVertical: spacing.lg,
    },
    instructionText: {
      ...typography(currentTheme).body,
      marginBottom: spacing.lg,
    },
    wordContainer: {
      marginBottom: spacing.md,
    },
    wordInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: 8,
      padding: spacing.md,
      color: currentTheme.text.primary,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    inputCorrect: {
      borderColor: currentTheme.success,
    },
    inputError: {
      borderColor: currentTheme.error,
    },
    label: {
      ...typography(currentTheme).body,
      fontWeight: 'bold',
      marginBottom: spacing.xs,
      color: currentTheme.text.primary,
    },
    helpText: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginTop: spacing.xs,
    },
    verificationComplete: {
      backgroundColor: currentTheme.success + '20', // transparent success color
      padding: spacing.md,
      borderRadius: 8,
      marginTop: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    verificationText: {
      ...typography(currentTheme).body,
      color: currentTheme.success,
      flex: 1,
    },
  });

  // Full verification mode (original behavior)
  if (verificationMode === 'full') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{i18n.t('import.verifySeed')}</Text>
          <Text style={styles.subtitle}>{i18n.t('import.verifySubtitle')}</Text>
          <TextInput
            style={styles.input}
            multiline
            value={input}
            onChangeText={setInput}
            placeholder={i18n.t('import.enterSeed')}
            placeholderTextColor={currentTheme.text.secondary}
            autoFocus={true}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.buttonContainer}>
            <Button 
              title={i18n.t('common.back')} 
              onPress={onCancel}
              variant="secondary"
            />
            <Button 
              title={i18n.t('common.verify')} 
              onPress={handleVerify}
              disabled={!input.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Partial verification mode (new behavior)
  return (
    <View style={styles.partialContainer}>
      <Text style={styles.instructionText}>
        Please enter the following words from your recovery phrase to verify you've saved it correctly.
      </Text>
      
      {verificationWords.map((item, index) => (
        <View key={index} style={styles.wordContainer}>
          <Text style={styles.label}>{getWordLabel(item.index)}</Text>
          <TextInput
            style={[
              styles.wordInput,
              item.input && (
                item.input.trim().toLowerCase() === item.word.toLowerCase() 
                  ? styles.inputCorrect 
                  : styles.inputError
              )
            ]}
            placeholder={`Enter word #${item.index + 1}`}
            placeholderTextColor={currentTheme.text.secondary}
            value={item.input}
            onChangeText={text => handleWordChange(text, index)}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
          <Text style={styles.helpText}>
            This is word #{item.index + 1} from your recovery phrase.
          </Text>
        </View>
      ))}
      
      {allCorrect && (
        <View style={styles.verificationComplete}>
          <Text style={styles.verificationText}>
            Verification complete! All words match your recovery phrase.
          </Text>
        </View>
      )}
    </View>
  );
} 