import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Text, 
  Pressable, 
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import {  useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useWallet } from '../contexts/WalletContext';
import { useSettings } from '../contexts/SettingsContext';
import { ExchangeService } from '../services/exchange';
import { Button } from '../components/Button';
import { colors, spacing, typography, layout, borderRadius } from '../theme';
import { AddressService } from '../services/address';
import { WebSocketService } from '../services/websocket';
import { useThemeMode } from '../contexts/ThemeContext';
type Currency = 'BTC' | 'USD' | 'EUR';

interface PaymentRequest {
  address: string;
  amount: number;
  currency: Currency;
}

interface PaymentRequestProps {
  onClose: () => void;
}

export default function PaymentRequest({ onClose }: PaymentRequestProps) {
  const { themeMode } = useThemeMode();
  const theme = themeMode === 'dark' ? colors.dark : colors.light;

  const { state: walletState, dispatch } = useWallet();
  const { state: settingsState } = useSettings();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(settingsState.settings.currency);
  const [rates, setRates] = useState({ USD: 0, EUR: 0 });
  const [qrData, setQrData] = useState('');
  const [copied, setCopied] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(100)).current;
  const [convertedAmounts, setConvertedAmounts] = useState({
    BTC: '',
    USD: '',
    EUR: '',
  });
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const [step, setStep] = useState<'amount' | 'qr'>('amount');


  const styles = StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.md,
      minHeight: '50%',
    },
    handle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.text.secondary,
      opacity: 0.2,
      alignSelf: 'center',
      marginTop: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
    },
    scrollView: {
      padding: spacing.md,
    },
    title: {
      ...typography(theme).heading,
      fontSize: 24,
      fontWeight: '500' as const,
    },
    closeButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.full,
    },
    card: {
      ...layout(theme).card,
      paddingVertical: spacing.md,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    currencySymbol: {
      ...typography(theme).heading,
      fontSize: 32,
      color: theme.text.primary,
      marginRight: spacing.xs,
      fontWeight: '500' as const,
    },
    input: {
      ...typography(theme).heading,
      fontSize: 32,
      color: theme.text.primary,
      minWidth: 120,
      textAlign: 'left',
      padding: 0,
      fontWeight: '500' as const,
    },
    currencySelector: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    currencyButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: theme.background,
      minWidth: 60,
      alignItems: 'center',
    },
    currencyButtonActive: {
      backgroundColor: theme.primary,
    },
    currencyText: {
      ...typography(theme).button,
      color: theme.text.primary,
      fontWeight: '500' as const,
    },
    currencyTextActive: {
      color: theme.white,
    },
    conversion: {
      ...typography(theme).caption,
      textAlign: 'center',
      marginTop: spacing.md,
      fontWeight: '500' as const,
    },
    qrCard: {
      ...layout(theme).card,
      alignItems: 'center',
      paddingVertical: spacing.lg,
      marginTop: spacing.md,
    },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      padding: spacing.sm,
      backgroundColor: theme.background,
      borderRadius: borderRadius.md,
      width: '100%',
    },
    address: {
      ...typography(theme).caption,
      flex: 1,
      marginRight: spacing.sm,
      fontWeight: '500' as const,
    },
    continueButton: {
      marginTop: spacing.xl,
    },
    newRequestButton: {
      marginTop: spacing.xl,
      width: '100%',
    },
    confirmationContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    confirmationText: {
      ...typography(theme).heading,
      color: theme.success,
      marginTop: spacing.md,
    },
    txIdText: {
      ...typography(theme).caption,
      color: theme.text.secondary,
      marginTop: spacing.sm,
    },
    amountDisplay: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    amountText: {
      ...typography(theme).heading,
      fontSize: 28,
      color: theme.text.primary,
      fontWeight: '600' as const,
    },
    btcAmount: {
      ...typography(theme).body,
      color: theme.text.secondary,
      marginTop: spacing.xs,
    },
    confirmationOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    }
    
  }); 

  useEffect(() => {
    loadExchangeRates();
    animateIn();
    getNextUnusedAddress().then(setCurrentAddress);
  }, []);

  function animateIn() {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function loadExchangeRates() {
    try {
      const newRates = await ExchangeService.getRates();
      setRates(newRates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  }

  async function getNextUnusedAddress(): Promise<string | null> {
    if (!walletState.xpubData) return null;
    const addresses = await AddressService.deriveAddresses(walletState.xpubData, walletState.index, 1);
    return addresses[0].address;
  }

  function generateQRData(paymentRequest: PaymentRequest): string {
    // Convert to BTC amount
    const btcAmount = currency === 'BTC' 
      ? Number(amount)
      : ExchangeService.convertToBTC(Number(amount), rates[currency]);

    // Format BTC amount with exactly 8 decimal places, no grouping
    const formattedAmount = btcAmount.toLocaleString('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
      useGrouping: false,
      style: 'decimal' // Ensure decimal format
    }).replace(/[^\d.]/g, ''); // Remove any non-digit characters except decimal point
    // Construct the BIP21 URI
    return `bitcoin:${paymentRequest.address}?amount=${formattedAmount}`;
  }

  async function handleGenerateRequest() {
    const address = await getNextUnusedAddress();
    if (!address) {
      console.error('No unused addresses available');
      return;
    }
    if (!amount) return;

    // Mark this address as used in this session
    const paymentRequest: PaymentRequest = {
      address,
      amount: Number(amount),
      currency,
    };

    const qrData = generateQRData(paymentRequest);
    setQrData(qrData);
  }

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function handleAmountChange(value: string) {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    if (cleanValue.split('.').length > 2) return;

    // Update amount immediately
    setAmount(cleanValue);
    
    // Early return if no valid number
    const numValue = parseFloat(cleanValue);
    if (!cleanValue || isNaN(numValue) || !rates.USD || !rates.EUR) {
      setConvertedAmounts({ BTC: '', USD: '', EUR: '' });
      return;
    }

    // Calculate conversions
    const conversions = currency === 'BTC' 
      ? {
          BTC: cleanValue,
          USD: (numValue * rates.USD).toFixed(2),
          EUR: (numValue * rates.EUR).toFixed(2)
        }
      : {
          BTC: ExchangeService.convertToBTC(numValue, rates[currency]).toFixed(8),
          USD: currency === 'USD' ? cleanValue : ExchangeService.convertToFiat(
            ExchangeService.convertToBTC(numValue, rates[currency]), 
            rates.USD
          ).toFixed(2),
          EUR: currency === 'EUR' ? cleanValue : ExchangeService.convertToFiat(
            ExchangeService.convertToBTC(numValue, rates[currency]), 
            rates.EUR
          ).toFixed(2)
        };

    setConvertedAmounts(conversions);
  }

  function handleCurrencyChange(newCurrency: Currency) {
    if (newCurrency === currency) return;
    
    setCurrency(newCurrency);
    if (!amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    // Convert amount to new currency
    let newAmount: string;
    if (newCurrency === 'BTC') {
      newAmount = ExchangeService.convertToBTC(numAmount, rates[currency as 'USD' | 'EUR']).toFixed(8);
    } else if (currency === 'BTC') {
      newAmount = ExchangeService.convertToFiat(numAmount, rates[newCurrency]).toFixed(2);
    } else {
      const btcAmount = ExchangeService.convertToBTC(numAmount, rates[currency as 'USD' | 'EUR']);
      newAmount = ExchangeService.convertToFiat(btcAmount, rates[newCurrency]).toFixed(2);
    }
    
    setAmount(newAmount);
  }


  useEffect(() => {
    getNextUnusedAddress().then(setCurrentAddress);
  }, [walletState.index]);

  // Add payment monitoring
  useEffect(() => {
    if (currentAddress && step === 'qr') {
      console.log(amount)
      const handleTransaction = (tx:any) => {
        // Check if this transaction involves our address and if amount is nearly correct. Beware, amount is in fiat or btc
        const btcAmount = currency === 'BTC' ? Number(amount) : ExchangeService.convertToBTC(Number(amount), rates[currency]);
        if (tx.addresses.includes(currentAddress) && tx.amount >= btcAmount * 0.99) {
          setPaymentConfirmed(true);
          setCurrentTxId(tx.txid);
          
          console.log('Payment confirmed');
          console.log(tx);
          // Push transaction to wallet context
          dispatch({
            type: 'ADD_TRANSACTION',
            payload: {
              ...tx,
              type: 'incoming',
              status: tx.confirmations > 0 ? 'confirmed' : 'pending'
            }
          });
          
        }
      };

      // Subscribe to WebSocket updates
      WebSocketService.subscribe(handleTransaction);

      // Cleanup
      return () => {
        WebSocketService.unsubscribe(handleTransaction);
      };
    }
  }, [currentAddress, step]);

  const renderAmountStep = () => (
    <View style={styles.card}>
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>
          {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₿'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
          placeholderTextColor={theme.text.secondary}
          autoFocus
        />
      </View>

      <View style={styles.currencySelector}>
        {(['BTC', 'USD', 'EUR'] as Currency[]).map((curr) => (
          <Pressable
            key={curr}
            style={[
              styles.currencyButton,
              currency === curr && styles.currencyButtonActive
            ]}
            onPress={() => handleCurrencyChange(curr)}
          >
            <Text style={[
              styles.currencyText,
              currency === curr && styles.currencyTextActive
            ]}>
              {curr}
            </Text>
          </Pressable>
        ))}
      </View>

      {amount && Object.entries(convertedAmounts)
        .filter(([curr]) => curr !== currency)
        .map(([curr, value]) => (
          <Text key={curr} style={styles.conversion}>
            ≈ {curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '₿'}{value} {curr}
          </Text>
        ))}

      <Button
        title="Continue"
        onPress={async () => {
          await handleGenerateRequest();
          setStep('qr');
        }}
        disabled={!amount || Number(amount) <= 0}
        style={styles.continueButton}
      />
    </View>
  );

  const renderQRStep = () => (
    <View style={styles.qrCard}>
      <View style={styles.amountDisplay}>
        <Text style={styles.amountText}>
          {currency === 'BTC' ? '₿' : currency === 'USD' ? '$' : '€'}
          {amount} {currency}
        </Text>
        {currency !== 'BTC' && (
          <Text style={styles.btcAmount}>
            ≈ ₿{convertedAmounts.BTC} BTC
          </Text>
        )}
      </View>

      {paymentConfirmed ? (
        <View style={styles.confirmationOverlay}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={64} 
            color={theme.success} 
          />
          <Text style={styles.confirmationText}>Payment Received!</Text>
          <Text style={styles.txIdText} numberOfLines={1}>
            Transaction: {currentTxId}
          </Text>
        </View>
      ) : (
        <>
          <QRCode
            value={qrData}
            size={240}
            backgroundColor={theme.white}
            color={theme.black}
          />
          <Pressable 
            style={styles.addressContainer}
            onPress={async () => {
              if (currentAddress) {
                await copyToClipboard(currentAddress);
              }
            }}
          >
            <Text style={styles.address} numberOfLines={1}>
              {currentAddress || 'No address available'}
            </Text>
            <MaterialCommunityIcons 
              name={copied ? "check" : "content-copy"} 
              size={20} 
              color={copied ? theme.success : theme.text.secondary} 
            />
          </Pressable>
        </>
      )}

      <Button
        title={paymentConfirmed ? "Done" : "New Request"}
        onPress={() => {
          if (paymentConfirmed) {
            onClose();
          } else {
            setStep('amount');
            setAmount('');
            setQrData('');
          }
        }}
        variant={paymentConfirmed ? "primary" : "secondary"}
        style={styles.newRequestButton}
      />
    </View>
  );

  const renderContent = () => {
    if (paymentConfirmed) {
      return (
        <View style={styles.confirmationContainer}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={64} 
            color={theme.success} 
          />
          <Text style={styles.confirmationText}>Payment Received!</Text>
          <Text style={styles.txIdText}>{currentTxId}</Text>
        </View>
      );
    }
    
    return (
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'amount' ? renderAmountStep() : renderQRStep()}
      </ScrollView>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.modalContainer}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <View style={styles.handle} />
              
              <View style={styles.header}>
                <Text style={styles.title}>Request Payment</Text>
                <Pressable 
                  style={styles.closeButton} 
                  onPress={onClose}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons 
                    name="close" 
                    size={24} 
                    color={theme.text.secondary} 
                  />
                </Pressable>
              </View>

              {renderContent()}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
