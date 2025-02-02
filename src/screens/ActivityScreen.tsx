import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Animated,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebSocketService } from '../services/websocket';
import { Transaction } from '../types/bitcoin';
import { colors, spacing, typography, layout } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const isIncoming = transaction.type === 'incoming';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }, []);

  const styles = StyleSheet.create({
   
    transactionItem: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      ...layout(currentTheme).card,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    detailsContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },
    amount: {
      ...typography(currentTheme).body,
      fontWeight: '600' as const,
    },
    status: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginTop: spacing.xs,
      fontWeight: '500' as const,
    },
    address: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginTop: spacing.xs,
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
        <View>
          <Text style={styles.amount}>
            {isIncoming ? '+' : '-'}{transaction.amount.toFixed(8)} BTC
          </Text>
        
        </View>
        <Text style={styles.address} numberOfLines={1}>
          {transaction.addresses[0]?.slice(0, 8)}...{transaction.addresses[0]?.slice(-8)}
        </Text>
      </View>
    </Animated.View>
  );
}

export function ActivityScreen() {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { state: walletState, dispatch } = useWallet();

  useEffect(() => {
    const handleNewTransaction = (tx: Transaction) => {
      // Add transaction to state
      setRecentTransactions(prev => [tx, ...prev]);

    };

    WebSocketService.subscribe(handleNewTransaction);
    return () => WebSocketService.unsubscribe(handleNewTransaction);
  }, [walletState.addresses]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    dispatch({ type: 'REFRESH' });
    setIsRefreshing(false);
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      padding: spacing.md,
      backgroundColor: currentTheme.background,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    headerText: {
      ...typography(currentTheme).heading,
      color: currentTheme.text.primary,
      fontWeight: '600' as const,
    },
    emptyState: {
      padding: spacing.xl,
    },
    emptyText: {
      ...typography(currentTheme).body,
      color: currentTheme.text.secondary,
      marginTop: spacing.md,
      fontWeight: '500' as const,
    },
  }); 

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Live Bitcoin transactions</Text>
      </View>

      <FlatList
        data={recentTransactions}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        keyExtractor={item => item.txid}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="bell-outline" 
              size={48} 
              color={currentTheme.text.secondary} 
            />
            <Text style={styles.emptyText}>
              Waiting for new transactions...
            </Text>
          </View>
        }
      />
    </View>
  );
}
