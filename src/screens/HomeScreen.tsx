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
  const [showActions, setShowActions] = useState(false);

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
  
  const handleSend = () => {
    navigation.navigate('Send');
  };
  
  const handleScan = () => {
    // This would navigate to the QR scanner screen when implemented
    // navigation.navigate('QRScanner');
    alert('QR scan functionality will be implemented in a future update.');
  };
  
  const toggleActions = () => {
    setShowActions(!showActions);
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
      gap: spacing.md,
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
      zIndex: 10,
    },
    fabSecondary: {
      backgroundColor: currentTheme.secondary,
    },
    fabSend: {
      position: 'absolute',
      bottom: spacing.xl + 80,
      right: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: currentTheme.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      zIndex: 9,
    },
    fabScan: {
      position: 'absolute',
      bottom: spacing.xl + 150,
      right: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: currentTheme.tertiary || currentTheme.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      zIndex: 8,
    },
    fabLabel: {
      position: 'absolute',
      right: 70,
      backgroundColor: currentTheme.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      ...typography(currentTheme).body,
    },
    actionsOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      zIndex: 5,
    },
    walletTypeTag: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      backgroundColor: walletState.hasFullWallet ? currentTheme.success + '30' : currentTheme.warning + '30',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    walletTypeText: {
      ...typography(currentTheme).caption,
      color: walletState.hasFullWallet ? currentTheme.success : currentTheme.warning,
      marginLeft: spacing.xs,
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
              title="Import Watch-only Wallet" 
              onPress={() => navigation.navigate('ImportXPub')} 
            />
            <Button 
              title="Create New Wallet" 
              onPress={() => navigation.navigate('CreateWallet')}
              variant="secondary" 
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showActions && <TouchableOpacity style={styles.actionsOverlay} onPress={toggleActions} />}
      
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
        
        <View style={styles.walletTypeTag}>
          <MaterialCommunityIcons 
            name={walletState.hasFullWallet ? "lock" : "eye"} 
            size={14} 
            color={walletState.hasFullWallet ? currentTheme.success : currentTheme.warning} 
          />
          <Text style={styles.walletTypeText}>
            {walletState.hasFullWallet ? "Full Wallet" : "Watch-only"}
          </Text>
        </View>
        
        <RecentTransactions 
          transactions={walletState.transactions} 
          isLoading={walletState.isLoading} 
        />
      </ScrollView>
      
      {/* Floating action button */}
      {walletState.hasFullWallet ? (
        // Full wallet - show action button with send/receive options
        <>
          <TouchableOpacity 
            style={styles.fab}
            onPress={toggleActions}
          >
            <MaterialCommunityIcons 
              name={showActions ? "close" : "bitcoin"} 
              size={28} 
              color={currentTheme.white} 
            />
          </TouchableOpacity>
          
          {showActions && (
            <>
              <TouchableOpacity 
                style={[styles.fab, styles.fabSecondary, {bottom: spacing.xl + 220}]}
                onPress={() => setShowPaymentRequest(true)}
              >
                <MaterialCommunityIcons 
                  name="qrcode" 
                  size={24} 
                  color={currentTheme.white} 
                />
                <Text style={styles.fabLabel}>Receive</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.fab, styles.fabPrimary, {bottom: spacing.xl + 160}]}
                onPress={handleSend}
              >
                <MaterialCommunityIcons 
                  name="arrow-up" 
                  size={24} 
                  color={currentTheme.white} 
                />
                <Text style={styles.fabLabel}>Send</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : (
        // Watch-only wallet - just show the receive button
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
      )}

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
