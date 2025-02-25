import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useWallet } from '../contexts/WalletContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { colors, spacing, typography } from '../theme';
import { StorageService } from '../services/storage';
import { TransactionService } from '../services/transaction';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SendScreen({ navigation }: any) {
  const { state, dispatch, sendTransaction } = useWallet();
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [recentAddresses, setRecentAddresses] = useState<Array<{ address: string; label: string; timestamp: number }>>([]);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  
  // Fetch fee rates when component mounts
  useEffect(() => {
    fetchFeeRates();
    loadRecentAddresses();
  }, []);
  
  async function fetchFeeRates() {
    try {
      setIsFetchingFees(true);
      const rates = await TransactionService.fetchFeeRates();
      // Update fee rates in wallet state - use dispatch directly, not state.dispatch
      dispatch({ type: 'SET_FEE_RATES', payload: rates });
    } catch (error) {
      console.error('Error fetching fee rates:', error);
    } finally {
      setIsFetchingFees(false);
    }
  }
  
  async function loadRecentAddresses() {
    try {
      const addresses = await StorageService.getRecentAddresses();
      setRecentAddresses(addresses || []);
    } catch (error) {
      console.error('Error loading recent addresses:', error);
    }
  }
  
  function getFeeRateValue() {
    if (!state.feeRates) return 10; // Default medium fee
    
    switch (selectedFee) {
      case 'slow': return state.feeRates.slow;
      case 'fast': return state.feeRates.fast;
      case 'medium':
      default: return state.feeRates.medium;
    }
  }
  
  async function handleSend() {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a valid Bitcoin address');
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    const amountBTC = Number(amount);
    const feeRate = getFeeRateValue();
    
    // Check if user has sufficient balance
    if (amountBTC > state.balance.confirmed) {
      Alert.alert('Insufficient Balance', 'You do not have enough confirmed funds to send this amount');
      return;
    }
    
    // Ask for confirmation
    Alert.alert(
      'Confirm Transaction',
      `Send ${amountBTC} BTC to ${address}?\nFee: ~${(feeRate * 0.000001 * 225).toFixed(8)} BTC`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Check if wallet has private keys
              if (!state.hasFullWallet) {
                Alert.alert('Error', 'This wallet is watch-only and cannot send transactions. Please import a wallet with private keys.');
                return;
              }
              
              // Send the transaction
              const txid = await sendTransaction(address, amountBTC, feeRate);
              
              // Show success message
              Alert.alert(
                'Transaction Sent',
                `Transaction ID: ${txid.substring(0, 10)}...`,
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Clear form and go back to home screen
                      setAddress('');
                      setAmount('');
                      navigation.navigate('Home');
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', `Failed to send transaction: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }
  
  function handleSelectRecentAddress(addr: string) {
    setAddress(addr);
  }
  
  function handleMaxAmount() {
    // Set the maximum amount (leaving a small amount for fees)
    const maxAmount = Math.max(0, state.balance.confirmed - 0.0001);
    setAmount(maxAmount.toFixed(8));
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.lg,
    },
    header: {
      ...typography(currentTheme).heading,
      marginBottom: spacing.md,
    },
    balanceContainer: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    balanceLabel: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginBottom: spacing.xs,
    },
    balanceValue: {
      ...typography(currentTheme).heading,
      color: currentTheme.text.primary,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginBottom: spacing.xs,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      borderRadius: 8,
      backgroundColor: currentTheme.surface,
    },
    input: {
      flex: 1,
      height: 50,
      paddingHorizontal: spacing.md,
      ...typography(currentTheme).body,
      color: currentTheme.text.primary,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    maxButton: {
      backgroundColor: currentTheme.primary + '20',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      marginRight: spacing.sm,
    },
    maxButtonText: {
      ...typography(currentTheme).caption,
      color: currentTheme.primary,
    },
    feeContainer: {
      marginBottom: spacing.xl,
    },
    feeTitle: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      marginBottom: spacing.sm,
    },
    feeButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    feeButton: {
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
    },
    feeButtonSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    feeButtonUnselected: {
      backgroundColor: 'transparent',
      borderColor: currentTheme.border,
    },
    feeButtonText: {
      ...typography(currentTheme).caption,
    },
    feeButtonTextSelected: {
      color: currentTheme.white,
    },
    feeButtonTextUnselected: {
      color: currentTheme.text.primary,
    },
    feeRate: {
      ...typography(currentTheme).caption,
      color: currentTheme.text.secondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    sendButton: {
      marginBottom: spacing.xl,
    },
    recentContainer: {
      marginTop: spacing.xl,
    },
    recentTitle: {
      ...typography(currentTheme).subheading,
      color: currentTheme.text.primary,
      marginBottom: spacing.md,
    },
    recentAddressItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      padding: spacing.md,
      borderRadius: 8,
      marginBottom: spacing.sm,
    },
    recentAddressText: {
      ...typography(currentTheme).body,
      color: currentTheme.text.primary,
      flex: 1,
      marginLeft: spacing.sm,
    },
    iconButton: {
      padding: spacing.sm,
    },
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.header}>Send Bitcoin</Text>
          
          {/* Balance */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{state.balance.confirmed.toFixed(8)} BTC</Text>
          </View>
          
          {/* Recipient Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Recipient Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter Bitcoin address"
                placeholderTextColor={currentTheme.text.secondary}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {address ? (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setAddress('')}
                >
                  <MaterialCommunityIcons name="close" size={20} color={currentTheme.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          
          {/* Amount */}
          <View style={styles.inputContainer}>
            <View style={styles.amountContainer}>
              <Text style={styles.inputLabel}>Amount (BTC)</Text>
              <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="0.00000000"
                placeholderTextColor={currentTheme.text.secondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              {amount ? (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setAmount('')}
                >
                  <MaterialCommunityIcons name="close" size={20} color={currentTheme.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          
          {/* Fee Selection */}
          <View style={styles.feeContainer}>
            <Text style={styles.feeTitle}>Transaction Fee</Text>
            <View style={styles.feeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.feeButton,
                  selectedFee === 'slow' ? styles.feeButtonSelected : styles.feeButtonUnselected
                ]}
                onPress={() => setSelectedFee('slow')}
              >
                <Text 
                  style={[
                    styles.feeButtonText,
                    selectedFee === 'slow' ? styles.feeButtonTextSelected : styles.feeButtonTextUnselected
                  ]}
                >
                  Slow
                </Text>
                <Text style={styles.feeRate}>
                  {isFetchingFees ? '...' : `${state.feeRates?.slow || 5} sat/vB`}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.feeButton,
                  selectedFee === 'medium' ? styles.feeButtonSelected : styles.feeButtonUnselected
                ]}
                onPress={() => setSelectedFee('medium')}
              >
                <Text 
                  style={[
                    styles.feeButtonText,
                    selectedFee === 'medium' ? styles.feeButtonTextSelected : styles.feeButtonTextUnselected
                  ]}
                >
                  Medium
                </Text>
                <Text style={styles.feeRate}>
                  {isFetchingFees ? '...' : `${state.feeRates?.medium || 10} sat/vB`}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.feeButton,
                  selectedFee === 'fast' ? styles.feeButtonSelected : styles.feeButtonUnselected
                ]}
                onPress={() => setSelectedFee('fast')}
              >
                <Text 
                  style={[
                    styles.feeButtonText,
                    selectedFee === 'fast' ? styles.feeButtonTextSelected : styles.feeButtonTextUnselected
                  ]}
                >
                  Fast
                </Text>
                <Text style={styles.feeRate}>
                  {isFetchingFees ? '...' : `${state.feeRates?.fast || 20} sat/vB`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Send Button */}
          <Button
            title="Send Bitcoin"
            onPress={handleSend}
            isLoading={isLoading || state.isSendingTransaction}
            disabled={
              isLoading || 
              state.isSendingTransaction || 
              !address || 
              !amount || 
              Number(amount) <= 0 ||
              Number(amount) > state.balance.confirmed
            }
            style={styles.sendButton}
          />
          
          {/* Recent Addresses */}
          {recentAddresses.length > 0 && (
            <View style={styles.recentContainer}>
              <Text style={styles.recentTitle}>Recent Addresses</Text>
              {recentAddresses.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentAddressItem}
                  onPress={() => handleSelectRecentAddress(item.address)}
                >
                  <MaterialCommunityIcons name="history" size={20} color={currentTheme.text.secondary} />
                  <Text style={styles.recentAddressText} numberOfLines={1} ellipsizeMode="middle">
                    {item.label || item.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 