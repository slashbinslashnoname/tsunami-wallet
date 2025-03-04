import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, layout, borderRadius } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
import { TransactionItem } from '../components/TransactionItem';
import i18n from '../i18n';

const TRANSACTIONS_PER_PAGE = 20;

export default function TransactionsScreen() {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation();
  const { state: walletState, dispatch } = useWallet();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
    },
    title: {
      ...typography(currentTheme).heading,
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
      ...typography(currentTheme).body,
      color: currentTheme.text.secondary,
      marginTop: spacing.sm,
    },
    loadMoreButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      backgroundColor: currentTheme.white,
      borderRadius: borderRadius.md,
      marginTop: spacing.md,
    },
    loadMoreText: {
      ...typography(currentTheme).body,
      color: currentTheme.primary,
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
            color={currentTheme.text.primary} 
          />
        </Pressable>
        <Text style={styles.title}>{i18n.t('transactions.title')}</Text>
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
            tintColor={currentTheme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="currency-btc" 
              size={48} 
              color={currentTheme.text.secondary} 
            />
            <Text style={styles.emptyText}>{i18n.t('home.noTransactions')}</Text>
          </View>
        }
        ListFooterComponent={
          hasMoreTransactions ? (
            <Pressable 
              style={styles.loadMoreButton}
              onPress={loadMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={currentTheme.primary} />
              ) : (
                <Text style={styles.loadMoreText}>{i18n.t('transactions.loadMore')}</Text>
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