import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
    },
    text: {
      ...typography(currentTheme).body,
      marginTop: spacing.md,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={currentTheme.primary} />
      <Text style={styles.text}>Loading wallet data...</Text>
    </SafeAreaView>
  );
} 