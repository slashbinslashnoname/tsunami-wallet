import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { BalanceCard } from '../components/BalanceCard';
import { RecentTransactions } from '../components/RecentTransactions';
import { PaymentRequestButton } from '../components/PaymentRequestButton';
import PaymentRequest from '../screens/PaymentRequestModal';
import { colors } from '../theme';

export default function HomeScreen() {
  const { state, dispatch } = useWallet();
  const [isPaymentRequestVisible, setPaymentRequestVisible] = useState(false);

  const onRefresh = useCallback(() => {
    dispatch({ type: 'REFRESH' });
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={state.isRefreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <BalanceCard balance={state.balance} />
          <RecentTransactions 
            transactions={state.transactions}
            isLoading={state.isLoading}
            number={10}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <PaymentRequestButton onPress={() => setPaymentRequestVisible(true)} />
      {isPaymentRequestVisible && (
        <PaymentRequest onClose={() => setPaymentRequestVisible(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
}); 