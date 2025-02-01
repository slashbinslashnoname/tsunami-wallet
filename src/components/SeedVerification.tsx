import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from './Button';
import { colors, spacing, shadows } from '../theme';
import i18n from '../i18n';
import { useThemeMode } from '../contexts/ThemeContext';

interface Props {
  seed: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function SeedVerification({ seed, onVerified, onCancel }: Props) {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (input.trim().toLowerCase() === seed.toLowerCase()) {
      onVerified();
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
      color: theme.text.primary,
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 20,
      color: theme.text.secondary,
    },
    input: {
      width: '100%',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
      minHeight: 100,
      textAlignVertical: 'top',
      color: theme.text.primary,
      backgroundColor: theme.surface,
      ...shadows(theme).medium,
    },
    error: {
      color: theme.error,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      width: '100%',
    },
  });

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
          placeholderTextColor={theme.text.secondary}
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