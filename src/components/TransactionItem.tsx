import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import i18n from '../i18n';

interface TransactionItemProps {
  transaction: Transaction;
  index?: number;
  onPress?: () => void;
}

export function TransactionItem({ transaction, index, onPress }: TransactionItemProps) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const { settings } = useSettings();
  const { currency, exchangeRates } = settings;
  
  const isIncoming = transaction.type === 'incoming';
  const date = new Date(transaction.timestamp).toLocaleDateString();

  // Get the relevant address to display
  const displayAddress = isIncoming 
    ? transaction.addresses[transaction.addresses.length - 1] // Last address is usually the receiving address
    : transaction.addresses[0]; // First address is usually the sending address
  
  // Format address for display (first 6 chars + ... + last 6 chars)
  const formattedAddress = displayAddress 
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-6)}`
    : '';

  const formatAmount = () => {
    if (currency === 'BTC') {
      return `${isIncoming ? '+' : '-'}${Math.abs(transaction.amount).toFixed(8)} BTC`;
    } else {
      const rate = currency === 'USD' ? exchangeRates.USD : exchangeRates.EUR;
      const fiatAmount = Math.abs(transaction.amount) * rate;
      const symbol = currency === 'USD' ? '$' : '€';
      return `${isIncoming ? '+' : '-'}${symbol}${fiatAmount.toFixed(2)}`;
    }
  };

  const styles = StyleSheet.create({
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.card.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: currentTheme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    detailsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftColumn: {
      flex: 1,
      marginRight: spacing.sm,
    },
    rightColumn: {
      alignItems: 'flex-end',
    },
    transactionType: {
      ...typography(currentTheme).body,
      fontWeight: '500' as const,
    },
    date: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
    },
    amount: {
      ...typography(currentTheme).body,
      textAlign: 'right',
      fontWeight: '600' as const,
    },
    incoming: {
      color: currentTheme.success,
    },
    outgoing: {
      color: currentTheme.error,
    },
    status: {
      ...typography(currentTheme).caption,
      textAlign: 'right',
      color: currentTheme.text.secondary,
    },
    confirmed: {
      color: currentTheme.text.primary,
    },
    address: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
    },
    btcAmount: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginTop: 2,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={isIncoming ? 'arrow-bottom-left' : 'arrow-top-right'} 
          size={24} 
          color={isIncoming ? currentTheme.success : currentTheme.error} 
        />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.leftColumn}>
          <Text style={styles.transactionType}>
            {isIncoming ? i18n.t('transactions.received') : i18n.t('transactions.sent')}
          </Text>
          <Text style={styles.address}>{formattedAddress}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={[styles.amount, isIncoming ? styles.incoming : styles.outgoing]}>
            {formatAmount()}
          </Text>
          {currency !== 'BTC' && (
            <Text style={styles.btcAmount}>
              {`${Math.abs(transaction.amount).toFixed(8)} BTC`}
            </Text>
          )}
          <Text style={[styles.status, transaction.confirmations > 0 && styles.confirmed]}>
            {transaction.status === 'pending' ? i18n.t('transactions.pending') : i18n.t('transactions.confirmed')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
} 