import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Pressable,
  Animated 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, layout, borderRadius } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
type RootStackParamList = {
  Transactions: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

function TransactionItem({ transaction, index }: { transaction: Transaction; index: number }) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const isIncoming = transaction.type === 'incoming';
  const amount = `${isIncoming ? '+' : '-'}${Math.abs(transaction.amount).toFixed(8)} BTC`;
  const date = new Date(transaction.timestamp).toLocaleDateString();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Get the relevant address to display
  const displayAddress = isIncoming 
    ? transaction.addresses[transaction.addresses.length - 1] // Last address is usually the receiving address
    : transaction.addresses[0]; // First address is usually the sending address
  
  // Format address for display (first 6 chars + ... + last 6 chars)
  const formattedAddress = displayAddress 
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-6)}`
    : '';

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

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
    },
    amount: {
      ...typography(currentTheme).body,
      textAlign: 'right',
      fontWeight: '600' as const,
    },
    incoming: {
      color: currentTheme.primary,
    },
    outgoing: {
      color: currentTheme.primary,
    },
    status: {
      ...typography(currentTheme).caption,
      textAlign: 'right',
      fontWeight: '500' as const,
    },
    confirmed: {
      color: currentTheme.text.primary,
    },
    address: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
    },
  });

  return (
    <Animated.View style={[styles.transactionItem, { opacity: fadeAnim }]}>
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
            {isIncoming ? 'Received' : 'Sent'}
          </Text>
          <Text style={styles.address}>{formattedAddress}</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={[styles.amount, isIncoming ? styles.incoming : styles.outgoing]}>
            {amount}
          </Text>
          <Text style={[styles.status, transaction.confirmations > 0 && styles.confirmed]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

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
        <Text style={styles.title}>Recent Transactions</Text>
        {transactions.length > number && (
          <Pressable 
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.viewAll}>View All</Text>
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
          <TransactionItem key={tx.txid} transaction={tx} index={index} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="currency-btc" 
            size={48} 
            color={currentTheme.text.secondary} 
          />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      )}
    </View>
  );
} 