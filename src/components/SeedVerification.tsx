import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
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
      padding: spacing.md,
    },
    content: {
      padding: 20,
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: theme.text.primary,
    },

    input: {
      borderRadius: 8,
      padding: spacing.sm,
      marginBottom: spacing.md,
      minHeight: 100,
      textAlignVertical: 'top',
      color: theme.text.primary,
      backgroundColor: theme.white,
      ...shadows(theme).medium,
    },
    error: {
      color: theme.error,
      marginBottom: spacing.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}></View>
      <Text style={styles.title}>{i18n.t('import.verifySeed')}</Text>
      <TextInput
        style={styles.input}
        multiline
        value={input}
        onChangeText={setInput}
        placeholder={i18n.t('import.enterSeed')}
        placeholderTextColor={theme.text.secondary}
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
  );
} 