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
import { colors, spacing, typography, shadows, layout, borderRadius } from '../theme';
import { AddressService } from '../services/address';
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
  const { state: walletState } = useWallet();
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
  const [usedAddresses, setUsedAddresses] = useState<Set<string>>(new Set());
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

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
    const btcAmount = currency === 'BTC' 
      ? Number(amount)
      : ExchangeService.convertToBTC(Number(amount), rates[currency]);

    // Ensure the amount is formatted to 8 decimal places for BTC
    const formattedAmount = btcAmount.toFixed(8);

    // Construct the QR data string with the address and amount
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
    setUsedAddresses(prev => new Set(prev).add(address));

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
    
    setAmount(cleanValue);

    // Auto-convert as user types
    if (cleanValue && rates.USD && rates.EUR) {
      const numValue = parseFloat(cleanValue);
      if (!isNaN(numValue)) {
        if (currency === 'BTC') {
          setConvertedAmounts({
            BTC: cleanValue,
            USD: (numValue * rates.USD).toFixed(2),
            EUR: (numValue * rates.EUR).toFixed(2)
          });
        } else {
          const btcAmount = ExchangeService.convertToBTC(numValue, rates[currency]);
          setConvertedAmounts({
            BTC: btcAmount.toFixed(8),
            USD: currency === 'USD' ? cleanValue : ExchangeService.convertToFiat(btcAmount, rates.USD).toFixed(2),
            EUR: currency === 'EUR' ? cleanValue : ExchangeService.convertToFiat(btcAmount, rates.EUR).toFixed(2)
          });
        }
      }
    }

    // Regenerate QR code data with the new amount
    if (currentAddress) {
      const paymentRequest: PaymentRequest = {
        address: currentAddress,
        amount: Number(cleanValue),
        currency,
      };
      const newQrData = generateQRData(paymentRequest);
      setQrData(newQrData);
    }
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

  // Reset used addresses when modal is closed
  useEffect(() => {
    return () => {
      setUsedAddresses(new Set());
    };
  }, []);

  useEffect(() => {
    getNextUnusedAddress().then(setCurrentAddress);
  }, [walletState.index]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom
            }
          ]}
        >
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
                color={colors.text.secondary} 
              />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                  placeholderTextColor={colors.text.secondary}
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
            </View>

            {qrData ? (
              <View style={styles.qrCard}>
                <QRCode
                  value={qrData}
                  size={240}
                  backgroundColor={colors.white}
                  color={colors.black}
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
                    color={copied ? colors.success : colors.text.secondary} 
                  />
                </Pressable>
              </View>
            ) : (
              <Button
                title="Generate Request"
                onPress={handleGenerateRequest}
                disabled={!amount || !currentAddress}
              />
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadows.large,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.secondary,
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
    ...typography.heading,
    fontSize: 24,
    fontWeight: '500' as const,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  card: {
    ...layout.card,
    paddingVertical: spacing.md,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  currencySymbol: {
    ...typography.heading,
    fontSize: 32,
    color: colors.text.primary,
    marginRight: spacing.xs,
    fontWeight: '500' as const,
  },
  input: {
    ...typography.heading,
    fontSize: 32,
    color: colors.text.primary,
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
    backgroundColor: colors.background,
    minWidth: 60,
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: colors.primary,
  },
  currencyText: {
    ...typography.button,
    color: colors.text.primary,
    fontWeight: '500' as const,
  },
  currencyTextActive: {
    color: colors.white,
  },
  conversion: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500' as const,
  },
  qrCard: {
    ...layout.card,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  address: {
    ...typography.caption,
    flex: 1,
    marginRight: spacing.sm,
    fontWeight: '500' as const,
  },
  generateButton: {
    marginTop: spacing.md,
  },
}); 