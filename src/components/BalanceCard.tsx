import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows, borderRadius, layout } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeMode } from '../contexts/ThemeContext';
import i18n from '../i18n';
import { Balance } from '../types/bitcoin';
import { LinearGradient } from 'expo-linear-gradient';

interface BalanceCardProps {
  balance: Balance;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation<StackNavigationProp<any>>();

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...shadows(currentTheme).large,
    },
    gradientContainer: {
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    label: {
      ...typography(currentTheme).caption,
      textTransform: 'uppercase' as const,
      fontWeight: '500' as const,
      color: currentTheme.white,
      opacity: 0.9,
    },
    balanceContainer: {
      marginVertical: spacing.md,
    },
    totalLabel: {
      ...typography(currentTheme).caption,
      color: currentTheme.white,
      opacity: 0.8,
      marginBottom: spacing.xs,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    btcSymbol: {
      ...typography(currentTheme).heading,
      fontSize: 24,
      color: currentTheme.white,
      marginRight: spacing.xs,
    },
    balance: {
      ...typography(currentTheme).heading,
      fontSize: 36,
      fontWeight: '600' as const,
      color: currentTheme.white,
    },
    unconfirmed: {
      ...typography(currentTheme).caption,
      marginTop: spacing.xs,
      color: currentTheme.white,
      opacity: 0.8,
    },
    details: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    detailLabel: {
      ...typography(currentTheme).caption,
      fontWeight: '500' as const,
      color: currentTheme.white,
      opacity: 0.9,
    },
    detailValue: {
      ...typography(currentTheme).body,
      fontWeight: '500' as const,
      color: currentTheme.white,
    },
    settingsButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      width: 36,
      height: 36,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[currentTheme.primary, 'black']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <Text style={styles.label}>{i18n.t('home.totalBalance')}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons 
              name="cog-outline" 
              size={20} 
              color={currentTheme.white} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.btcSymbol}>₿</Text>
            <Text style={styles.balance}>
              {(balance.confirmed + balance.unconfirmed).toFixed(8)}
            </Text>
          </View>
          
          {balance.unconfirmed > 0 && (
            <Text style={styles.unconfirmed}>
              {i18n.t('home.pendingBalance', { amount: balance.unconfirmed.toFixed(8) })}
            </Text>
          )}
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>₿ {balance.confirmed.toFixed(8)}</Text>
          </View>
          
          {balance.unconfirmed > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pending</Text>
              <Text style={styles.detailValue}>₿ {balance.unconfirmed.toFixed(8)}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
