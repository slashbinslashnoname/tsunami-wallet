import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, layout, borderRadius } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;
  const isIncoming = transaction.type === "incoming";
  const amount = transaction.amount.toFixed(8);
  const date = new Date(transaction.timestamp).toLocaleDateString();

  // Get the relevant address to display
  const address = isIncoming 
    ? transaction.addresses[transaction.addresses.length - 1] // Last address is usually the receiving address
    : transaction.addresses[0]; // First address is usually the sending address

  const styles = StyleSheet.create({

    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      ...layout(theme).card,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    detailsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transactionType: {
      ...typography(theme).body,
      fontWeight: '500',
    },
    date: {
      ...typography(theme).caption,
      color: theme.text.secondary,
    },
    amount: {
      ...typography(theme).body,
      textAlign: 'right',
      fontWeight: '600',
    },
    currency: {
      color: theme.primary,
    },
    incoming: {
      color: theme.primary,
    },
    outgoing: {
      color: theme.primary,
    },
    status: {
      ...typography(theme).caption,
      color: theme.text.secondary,
      textAlign: 'right',
    },
    confirmed: {
      color: theme.primary,
    },
  });

  return (
    <View style={styles.transactionItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={isIncoming ? 'arrow-bottom-left' : 'arrow-top-right'} 
          size={24} 
          color={isIncoming ? theme.success : theme.error} 
        />
      </View>
      <View style={styles.detailsContainer}>
        <View>
          <Text style={styles.transactionType}>
            {isIncoming ? 'Received' : 'Sent'}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View>
          <Text style={[styles.amount, isIncoming ? styles.incoming : styles.outgoing]}>
            {isIncoming ? '+' : ''}{amount} <Text style={styles.currency}>BTC</Text>
          </Text>
          <Text style={[styles.status, transaction.confirmations > 0 && styles.confirmed]}>
            {transaction.confirmations === 0 ? 'pending' :
             'confirmed'}
          </Text>
        </View>

      </View>
    </View>
  );
}

const TRANSACTIONS_PER_PAGE = 20;

export default function TransactionsScreen() {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation();
  const { state: walletState, dispatch } = useWallet();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
    },
    title: {
      ...typography(theme).heading,
      fontSize: 20,
    },
    listContent: {
      padding: spacing.md,
    },
    emptyListContent: {
      flex: 1,
      justifyContent: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      ...typography(theme).body,
      color: theme.text.secondary,
      marginTop: spacing.sm,
    },
    loadMoreButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      backgroundColor: theme.white,
      borderRadius: borderRadius.md,
      marginTop: spacing.md,
    },
    loadMoreText: {
      ...typography(theme).body,
      color: theme.primary,
    },
    address: {
      ...typography(theme).caption,
      color: theme.text.secondary,
    },
  });

  const paginatedTransactions = walletState.transactions.slice(0, (page + 1) * TRANSACTIONS_PER_PAGE);
  const hasMoreTransactions = paginatedTransactions.length < walletState.transactions.length;

  const onRefresh = async () => {
    if (!walletState.xpubData) return;
    
    setIsRefreshing(true);
    try {
      dispatch({ type: "REFRESH" });
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMore = () => {
    if (isLoadingMore || !hasMoreTransactions) return;
    setIsLoadingMore(true);
    setPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.text.primary} 
          />
        </Pressable>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={paginatedTransactions}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        keyExtractor={item => item.txid}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="currency-btc" 
              size={48} 
              color={theme.text.secondary} 
            />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
        ListFooterComponent={
          hasMoreTransactions ? (
            <Pressable 
              style={styles.loadMoreButton}
              onPress={loadMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text style={styles.loadMoreText}>Load More</Text>
              )}
            </Pressable>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          !paginatedTransactions.length && styles.emptyListContent
        ]}
      />
    </SafeAreaView>
  );
} 