import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { useSettings } from '../contexts/SettingsContext';
import { BalanceCard } from '../components/BalanceCard';
import { RecentTransactions } from '../components/RecentTransactions';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
import PaymentRequest from './PaymentRequestModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../i18n';

export default function HomeScreen({ navigation }: any) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const { state: walletState, dispatch } = useWallet();
  const settingsContext = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);

  useEffect(() => {
    if (walletState.xpubData) {
      dispatch({ type: 'REFRESH' });
    }
  }, [walletState.xpubData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    dispatch({ type: 'REFRESH' });
    setIsRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      ...typography(currentTheme).body,
      color: currentTheme.text.secondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    buttonContainer: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    title: {
      ...typography(currentTheme).heading,
      fontSize: 24,
    },
    fab: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.xl,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: currentTheme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });

  if (!walletState.xpubData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="wallet-outline" 
            size={64} 
            color={currentTheme.text.secondary} 
          />
          <Text style={styles.emptyText}>
            You need to import or create a wallet to start using the app.
          </Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="Import Wallet" 
              onPress={() => navigation.navigate('ImportXPub')} 
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.primary]}
            tintColor={currentTheme.primary}
          />
        }
      >
        <BalanceCard balance={walletState.balance} />
        
        <RecentTransactions 
          transactions={walletState.transactions} 
          isLoading={walletState.isLoading} 
        />
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowPaymentRequest(true)}
      >
        <MaterialCommunityIcons 
          name="qrcode" 
          size={28} 
          color={currentTheme.white} 
        />
      </TouchableOpacity>

      {showPaymentRequest && settingsContext && (
        <PaymentRequest 
          onClose={() => setShowPaymentRequest(false)}
          navigation={navigation}
          route={{}}
          settingsContext={settingsContext}
        />
      )}
    </SafeAreaView>
  );
}
