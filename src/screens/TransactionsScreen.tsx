import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, layout, borderRadius } from '../theme';
import { AddressService } from '../services/address';

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isIncoming = transaction.amount > 0;
  const amount = transaction.amount.toFixed(8);
  const date = new Date(transaction.timestamp).toLocaleDateString();

  return (
    <View style={styles.transactionItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={isIncoming ? 'arrow-bottom-left' : 'arrow-top-right'} 
          size={24} 
          color={isIncoming ? colors.success : colors.error} 
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
             transaction.confirmations === 1 ? '1 confirmation' :
             transaction.confirmations < 6 ? `${transaction.confirmations} confirmations` :
             'confirmed'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const TRANSACTIONS_PER_PAGE = 20;

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { state: walletState, dispatch } = useWallet();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get all transactions and ensure we have both incoming and outgoing
  const allTransactions = React.useMemo(() => {
    return walletState.transactions.map(tx => ({
      ...tx,
      // Keep the original amount sign to determine transaction type
      amount: tx.amount,
      type: tx.amount > 0 ? 'incoming' : 'outgoing'
    }));
  }, [walletState.transactions]);

  const sortedTransactions = React.useMemo(() => 
    [...allTransactions].sort((a, b) => b.timestamp - a.timestamp),
    [allTransactions]
  );

  const paginatedTransactions = sortedTransactions.slice(0, (page + 1) * TRANSACTIONS_PER_PAGE);
  const hasMoreTransactions = paginatedTransactions.length < sortedTransactions.length;

  const onRefresh = async () => {
    if (!walletState.xpubData) return;
    
    setIsRefreshing(true);
    try {
      const [balance, transactions] = await Promise.all([
        AddressService.getXpubBalance(walletState.xpubData.xpub),
        AddressService.getXpubTransactions(walletState.xpubData.xpub)
      ]);

      dispatch({ type: 'SET_BALANCE', payload: balance });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
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
            color={colors.text.primary} 
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
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="currency-btc" 
              size={48} 
              color={colors.text.secondary} 
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
                <ActivityIndicator color={colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  title: {
    ...typography.heading,
    fontSize: 20,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...layout.card,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
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
    ...typography.body,
    fontWeight: '500',
  },
  date: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  amount: {
    ...typography.body,
    textAlign: 'right',
    fontWeight: '600',
  },
  currency: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  incoming: {
    color: colors.success,
  },
  outgoing: {
    color: colors.error,
  },
  status: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  confirmed: {
    color: colors.success,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  loadMoreText: {
    ...typography.body,
    color: colors.primary,
  },
}); 