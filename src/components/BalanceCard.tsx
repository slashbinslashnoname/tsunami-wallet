import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows, borderRadius, layout } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface BalanceCardProps {
  balance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const navigation = useNavigation<StackNavigationProp<any>>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Total Balance</Text>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.balance}>
        ₿ {balance.total.toFixed(8)}
      </Text>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...layout.card,
    marginBottom: spacing.md,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase' as const,
    fontWeight: '500' as const,
  },
  refreshButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  balance: {
    ...typography.heading,
    fontSize: 36,
    marginBottom: spacing.lg,
    fontWeight: '500' as const,
  },
  details: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    fontWeight: '500' as const,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '500' as const,
  },
  settingsButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 