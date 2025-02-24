import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Pressable,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, layout, borderRadius } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
import { TransactionItem } from './TransactionItem';
import i18n from '../i18n';

type RootStackParamList = {
  Transactions: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function RecentTransactions({ 
  number = 10, 
  transactions, 
  isLoading 
}: { 
  number?: number;
  transactions: Transaction[]; 
  isLoading: boolean;
}) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation<NavigationProp>();
  const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  const recentTransactions = sortedTransactions.slice(0, number);

  const styles = StyleSheet.create({
    container: {
      ...layout(currentTheme).card,
      marginHorizontal: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography(currentTheme).subheading,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    viewAll: {
      ...typography(currentTheme).button,
      color: currentTheme.primary,
      marginRight: spacing.xs,
    },
    loader: {
      padding: spacing.xl,
    },
    emptyState: {
      ...layout(currentTheme).center,
      padding: spacing.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    emptyText: {
      ...typography(currentTheme).body,
      color: currentTheme.text.secondary,
      marginTop: spacing.sm,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('home.recentTransactions')}</Text>
        {transactions.length > number && (
          <Pressable 
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.viewAll}>{i18n.t('home.viewAll')}</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={currentTheme.primary} 
            />
          </Pressable>
        )}
      </View>

      {recentTransactions.length > 0 ? (
        recentTransactions.map((tx, index) => (
          <TransactionItem 
            key={tx.txid} 
            transaction={tx} 
            index={index}
            onPress={() => navigation.navigate('Transactions')}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="currency-btc" 
            size={48} 
            color={currentTheme.text.secondary} 
          />
          <Text style={styles.emptyText}>{i18n.t('home.noTransactions')}</Text>
        </View>
      )}
    </View>
  );
} 