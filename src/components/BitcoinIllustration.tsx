import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { colors } from '../theme';
import i18n from '../i18n';

export function BitcoinIllustration() {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: theme.text.secondary,
    marginBottom: 20,
  }
}); 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('welcome.title')}</Text>
      <Image 
        source={require('../../assets/logo-debut.png')} 
        style={styles.image}
      />
      <Text style={styles.subtitle}>{i18n.t('welcome.subtitle')}</Text>
    </View>
  );
}
