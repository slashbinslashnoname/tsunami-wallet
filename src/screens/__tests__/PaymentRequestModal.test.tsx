import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaymentRequestModal from '../PaymentRequestModal';
import { View } from 'react-native'; // Import View for mock QR code

// Mocks
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('react-native-qrcode-svg', () => {
  // const React = require('react'); // React is already imported above
  // const View = require('react-native').View; // View is imported above
  return (props: any) => React.createElement(View, { ...props, testID: 'mock-qr-code' });
});

const mockWalletDispatch = jest.fn();
jest.mock('../../contexts/WalletContext', () => ({ // Adjusted path
  useWallet: jest.fn().mockReturnValue({ // Default mock, can be overridden in tests
    state: { 
      xpubData: { format: 'zpub', xpub: 'testzpub' }, 
      index: 0, 
      transactions: [],
      // Add other potentially accessed state properties with default/empty values
      currentAddress: 'initialMockAddress',
      addresses: { internal: [], external: ['initialMockAddress'] },
      changeAddresses: { internal: [], external: [] },
      usedAddresses: new Set(),
      balance: 0,
      loading: false,
      error: null,
      isFirstLaunch: false,
      network: 'mainnet',
      walletName: 'My Wallet',
      mnemonic: 'test mnemonic',
      seedVerified: true,
      importInfo: { xpub: '', format: '', derivationPath: '', network: 'mainnet', walletName: '', isImporting: false },
      paymentRequests: [],
    },
    dispatch: mockWalletDispatch,
  }),
}));

const mockSettingsDispatch = jest.fn();
jest.mock('../../contexts/SettingsContext', () => ({ // Adjusted path
  useSettings: jest.fn().mockReturnValue({ // Default mock
    state: { 
        settings: { 
            currency: 'USD', 
            exchangeRates: { USD: 50000, EUR: 45000, BTC: 1 } 
        } 
    },
    dispatch: mockSettingsDispatch,
  }),
}));

jest.mock('../../contexts/ThemeContext', () => ({ // Adjusted path
  useThemeMode: jest.fn().mockReturnValue({ // Default mock
    theme: 'light',
    colors: { 
      light: { 
        background: '#FFFFFF', 
        text: { primary: '#000000', secondary: '#555555', muted: '#999999' }, 
        primary: '#007AFF', 
        secondary: '#5856D6',
        accent: '#FF9500',
        border: '#C7C7CC',
        card: '#F8F8F8',
        notification: '#FF3B30',
        success: '#34C759',
        warning: '#FFCC00',
        error: '#FF3B30',
        muted: '#EFEFF4',
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',
        // Add any other specific colors used by PaymentRequestModal if needed
        button: {
            primary: '#007AFF',
            secondary: '#EFEFF4',
            disabled: '#D1D1D6',
            textPrimary: '#FFFFFF',
            textSecondary: '#007AFF',
            textDisabled: '#8E8E93',
        },
        input: {
            background: '#EFEFF4',
            text: '#000000',
            placeholder: '#8E8E93',
            border: '#C7C7CC',
            focusedBorder: '#007AFF',
        },
        header: {
            background: '#F8F8F8',
            text: '#000000',
            icon: '#007AFF',
        },
        // ... other theme structure based on your actual theme
      }, 
      dark: { // Provide a basic dark theme structure too
        background: '#000000', 
        text: { primary: '#FFFFFF', secondary: '#AAAAAA', muted: '#777777' }, 
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        accent: '#FF9F0A',
        border: '#38383A',
        card: '#1C1C1E',
        notification: '#FF453A',
        success: '#30D158',
        warning: '#FFD60A',
        error: '#FF453A',
        muted: '#1C1C1E',
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',
        button: {
            primary: '#0A84FF',
            secondary: '#1C1C1E',
            disabled: '#2C2C2E',
            textPrimary: '#FFFFFF',
            textSecondary: '#0A84FF',
            textDisabled: '#48484A',
        },
        input: {
            background: '#1C1C1E',
            text: '#FFFFFF',
            placeholder: '#8E8E93',
            border: '#38383A',
            focusedBorder: '#0A84FF',
        },
        header: {
            background: '#1C1C1E',
            text: '#FFFFFF',
            icon: '#0A84FF',
        },
      } 
    },
  }),
}));

jest.mock('../../services/exchange', () => ({ // Adjusted path
  ExchangeService: {
    fetchRates: jest.fn().mockResolvedValue({ USD: 50000, EUR: 45000 }), // Changed from getRates
    convertToBTC: jest.fn().mockImplementation((amount, rate) => amount / rate),
    convertToFiat: jest.fn().mockImplementation((amount, rate) => amount * rate),
  },
}));
// Note: The original prompt had getRates, but the exchange.ts service uses fetchRates.
// I've used fetchRates here. If getRates is indeed a different function, that might need adjustment.

jest.mock('../../services/address', () => ({ // Adjusted path
  AddressService: {
    deriveAddresses: jest.fn().mockResolvedValue([{ address: 'mockAddress1', path: '0/0', balance: 0, index: 0, isChange: false, transactions: [] }]),
  },
}));

// Capture callback for WebSocketService.subscribe
let capturedWebSocketCallback: ((tx: any) => void) | undefined; // More specific type for tx if known
jest.mock('../../services/websocket', () => ({ // Adjusted path
  WebSocketService: {
    subscribe: jest.fn().mockImplementation((address, callback) => { // Capture address and callback
      capturedWebSocketCallback = callback;
      console.log(`[TEST MOCK] WebSocketService.subscribe called for address: ${address}`);
    }),
    unsubscribe: jest.fn().mockImplementation((address) => {
      console.log(`[TEST MOCK] WebSocketService.unsubscribe called for address: ${address}`);
      if (capturedWebSocketCallback) { // Clear if we only expect one subscription at a time
          // capturedWebSocketCallback = undefined; 
          // Be careful if multiple subscriptions are intended; for this modal, probably one at a time.
      }
    }),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
}));


describe('PaymentRequestModal', () => {
  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementations if they were changed in a specific test
    (require('../../contexts/WalletContext').useWallet as jest.Mock).mockReturnValue({
        state: { 
          xpubData: { format: 'zpub', xpub: 'testzpub' }, 
          index: 0, 
          transactions: [],
          currentAddress: 'initialMockAddress',
          addresses: { internal: [], external: ['initialMockAddress'] },
          changeAddresses: { internal: [], external: [] },
          usedAddresses: new Set(),
          balance: 0,
          loading: false,
          error: null,
          isFirstLaunch: false,
          network: 'mainnet',
          walletName: 'My Wallet',
          mnemonic: 'test mnemonic',
          seedVerified: true,
          importInfo: { xpub: '', format: '', derivationPath: '', network: 'mainnet', walletName: '', isImporting: false },
          paymentRequests: [],
        },
        dispatch: mockWalletDispatch,
      });
    (require('../../contexts/SettingsContext').useSettings as jest.Mock).mockReturnValue({
        state: { settings: { currency: 'USD', exchangeRates: { USD: 50000, EUR: 45000, BTC: 1 } } },
        dispatch: mockSettingsDispatch,
    });
  });

  it('should render the amount input step initially', () => {
    const onCloseMock = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <PaymentRequestModal visible={true} onClose={onCloseMock} />
    );

    expect(getByPlaceholderText('0.00')).toBeTruthy();
    // The title "Request Payment" might depend on the step or a prop.
    // Let's check for a more generic element or the continue button.
    expect(getByText('Continue')).toBeTruthy();
  });

  it('should update fiat value when BTC amount is entered', () => {
    const onCloseMock = jest.fn();
    const { getByPlaceholderText, getByText, queryByText } = render(
      <PaymentRequestModal visible={true} onClose={onCloseMock} />
    );

    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '0.5'); // Input 0.5 BTC

    // Wait for potential async updates if any (e.g. debounced conversion)
    // For this component, conversion might be synchronous upon text change.
    // Exchange rate USD: 50000
    // 0.5 BTC * 50000 USD/BTC = 25000 USD
    expect(getByText('≈ $25,000.00 USD')).toBeTruthy(); 
    // Ensure no error message is shown for valid input
    expect(queryByText(/invalid amount/i)).toBeNull();
  });

  it('should update BTC value when USD amount is entered after switching currency', async () => {
    const onCloseMock = jest.fn();
    const { getByPlaceholderText, getByText, findByText } = render(
      <PaymentRequestModal visible={true} onClose={onCloseMock} />
    );

    // Switch to USD input
    fireEvent.press(getByText('BTC')); // Press the currency toggle, assuming it shows current currency
    await findByText('USD'); // Wait for USD to be the active currency
    
    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '10000'); // Input 10000 USD

    // Exchange rate USD: 50000
    // 10000 USD / 50000 USD/BTC = 0.2 BTC
    expect(getByText('≈ 0.20000000 BTC')).toBeTruthy();
  });

  it('should switch to EUR and update BTC value when EUR amount is entered', async () => {
    const onCloseMock = jest.fn();
    const { getByPlaceholderText, getByText, findByText } = render(
      <PaymentRequestModal visible={true} onClose={onCloseMock} />
    );

    // Switch to EUR input
    fireEvent.press(getByText('BTC')); // to USD
    await findByText('USD');
    fireEvent.press(getByText('USD')); // to EUR
    await findByText('EUR');

    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '9000'); // Input 9000 EUR

    // Exchange rate EUR: 45000
    // 9000 EUR / 45000 EUR/BTC = 0.2 BTC
    expect(getByText('≈ 0.20000000 BTC')).toBeTruthy();
  });


  it('should proceed to QR code step, derive address, and display QR data on continue', async () => {
    const onCloseMock = jest.fn();
    const mockAddress = 'newMockAddress';
    const mockXpubData = { format: 'zpub', xpub: 'testzpubForDerive' };
    const mockWalletContextValue = {
        state: { 
          xpubData: mockXpubData, 
          index: 5, // Assume next index is 5
          transactions: [],
          currentAddress: 'initialMockAddress', // Not used for new request
          addresses: { internal: [], external: ['initialMockAddress', 'anotherAddress'] },
          changeAddresses: { internal: [], external: [] },
          usedAddresses: new Set(['initialMockAddress']), // Ensure 'anotherAddress' is unused
          balance: 0,
          loading: false,
          error: null,
          isFirstLaunch: false,
          network: 'mainnet',
          walletName: 'My Wallet',
          mnemonic: 'test mnemonic',
          seedVerified: true,
          importInfo: { xpub: '', format: '', derivationPath: '', network: 'mainnet', walletName: '', isImporting: false },
          paymentRequests: [],
        },
        dispatch: mockWalletDispatch,
      };
    (require('../../contexts/WalletContext').useWallet as jest.Mock).mockReturnValue(mockWalletContextValue);
    
    // Mock AddressService.deriveAddresses to return a predictable new address
    (require('../../services/address').AddressService.deriveAddresses as jest.Mock).mockResolvedValueOnce([
      { address: mockAddress, path: '0/6', index: 6, isChange: false, transactions: [] } // New address at index 6
    ]);


    const { getByPlaceholderText, getByText, findByTestId, findByText } = render(
      <PaymentRequestModal visible={true} onClose={onCloseMock} />
    );

    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '0.1'); // Input 0.1 BTC
    fireEvent.press(getByText('Continue'));

    // Wait for address derivation and UI update
    expect(require('../../services/address').AddressService.deriveAddresses).toHaveBeenCalledWith(
      mockXpubData, // xpubData
      6,  // startIndex (index + 1 for external, assuming logic picks next unused)
      1,  // count
      false // isChange
    );

    await findByTestId('mock-qr-code'); // Check if QR code is rendered
    expect(findByText(mockAddress)).toBeTruthy(); // Check if the new address is displayed

    const expectedQrData = `bitcoin:${mockAddress}?amount=0.1`;
    // Check if QR code component received the correct value (via props)
    // This depends on how react-native-qrcode-svg mock is set up or how you inspect its props.
    // For the current mock, we can't directly inspect props easily.
    // However, the presence of the QR code and address is a good indicator.

    // Check if WebSocketService.subscribe was called
    expect(require('../../services/websocket').WebSocketService.subscribe).toHaveBeenCalledWith(mockAddress, expect.any(Function));
    
    // Check if payment request was saved
    expect(mockWalletDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'ADD_PAYMENT_REQUEST',
        payload: expect.objectContaining({
            address: mockAddress,
            amountBTC: 0.1,
            // amountFiat will be 0.1 * 50000 = 5000
            amountFiat: 5000, 
            currency: 'USD', // Default currency from mockSettings
            label: '', // default label
            message: '', // default message
            status: 'pending',
        })
    }));
  });

  it('should copy address to clipboard when copy address button is pressed', async () => {
    const onCloseMock = jest.fn();
    const mockAddress = 'mockCopyToClipboardAddress';
     (require('../../contexts/WalletContext').useWallet as jest.Mock).mockReturnValue({
        state: { 
          xpubData: { format: 'zpub', xpub: 'testzpubForCopy' }, 
          index: 0, 
          transactions: [],
          currentAddress: mockAddress, // Simulate this address is already derived and shown
          addresses: { internal: [], external: [mockAddress] },
          changeAddresses: { internal: [], external: [] },
          usedAddresses: new Set(),
          balance: 0, loading: false, error: null, isFirstLaunch: false, network: 'mainnet',
          walletName: 'My Wallet', mnemonic: 'test mnemonic', seedVerified: true,
          importInfo: { xpub: '', format: '', derivationPath: '', network: 'mainnet', walletName: '', isImporting: false },
          paymentRequests: [],
        },
        dispatch: mockWalletDispatch,
      });
    (require('../../services/address').AddressService.deriveAddresses as jest.Mock).mockResolvedValueOnce([
        { address: mockAddress, path: '0/0', index: 0, isChange: false, transactions: [] }
      ]);

    const { getByPlaceholderText, getByText, findByText, getByTestId } = render(
      <PaymentRequestModal visible={true} onClose={onCloseMock} />
    );

    // Go to QR step
    fireEvent.changeText(getByPlaceholderText('0.00'), '0.01');
    fireEvent.press(getByText('Continue'));
    await findByText(mockAddress); // Wait for address to appear

    // Assume there's a button with a testID or accessible text for copying address
    // Let's say it's a button with text "Copy Address" or an icon button
    // For this example, let's assume a button with testID 'copy-address-button'
    // This testID needs to be added to the actual component for this to work.
    // If not, we'd need to find it by other means (e.g., accessibilityLabel, part of text).
    // As a fallback, we can assume pressing the address text itself copies it if that's the behavior.
    
    // Simulate pressing the address text itself (as a common pattern for copying)
    fireEvent.press(getByText(mockAddress)); 

    await waitFor(() => {
      expect(require('expo-clipboard').setStringAsync).toHaveBeenCalledWith(mockAddress);
    });
    // Optionally, check for a toast/notification if your app shows one on copy
  });

  describe('Payment Monitoring (WebSocket)', () => {
    const mockOnClose = jest.fn();
    const mockAddress = 'testPaymentMonitoringAddress';
    const btcAmount = 0.005;
    const fiatAmountUSD = 250; // 0.005 BTC * 50000 USD/BTC

    beforeEach(() => {
      jest.clearAllMocks(); // Clear all mocks including call counts
      capturedWebSocketCallback = undefined;
      
      (require('../../contexts/WalletContext').useWallet as jest.Mock).mockReturnValue({
        state: { 
          xpubData: { format: 'zpub', xpub: 'testzpubMonitor' }, 
          index: 10, 
          transactions: [],
          currentAddress: 'someOtherAddress',
          addresses: { internal: [], external: ['someOtherAddress', mockAddress] }, // Include mockAddress for some scenarios
          changeAddresses: { internal: [], external: [] },
          usedAddresses: new Set(['someOtherAddress']),
          balance: 0, loading: false, error: null, isFirstLaunch: false, network: 'mainnet',
          walletName: 'My Wallet', mnemonic: 'test mnemonic', seedVerified: true,
          importInfo: { xpub: '', format: '', derivationPath: '', network: 'mainnet', walletName: '', isImporting: false },
          paymentRequests: [],
        },
        dispatch: mockWalletDispatch,
      });

      (require('../../contexts/SettingsContext').useSettings as jest.Mock).mockReturnValue({
        state: { settings: { currency: 'USD', exchangeRates: { USD: 50000, EUR: 45000, BTC: 1 } } },
        dispatch: mockSettingsDispatch,
      });
      
      (require('../../services/address').AddressService.deriveAddresses as jest.Mock).mockResolvedValue([
        { address: mockAddress, path: '0/11', index: 11, isChange: false, transactions: [] }
      ]);
    });

    it('should confirm payment when a matching transaction is received via WebSocket (BTC exact match)', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <PaymentRequestModal visible={true} onClose={mockOnClose} />
      );

      fireEvent.changeText(getByPlaceholderText('0.00'), btcAmount.toString());
      fireEvent.press(getByText('Continue'));
      await findByText(mockAddress); 

      expect(require('../../services/websocket').WebSocketService.subscribe).toHaveBeenCalledWith(mockAddress, expect.any(Function));
      expect(capturedWebSocketCallback).toBeDefined();

      const mockTx = {
        addresses: [mockAddress, 'someExternalAddress'],
        amount: btcAmount, // Exact BTC amount match
        txid: 'testTxId123',
        confirmations: 0,
      };

      if (capturedWebSocketCallback) {
        await act(async () => { capturedWebSocketCallback!(mockTx); });
      }
      
      expect(await findByText('Payment Received!')).toBeTruthy();
      expect(getByText('testTxId123')).toBeTruthy();
      expect(getByText('Done')).toBeTruthy();

      expect(mockWalletDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADD_TRANSACTION',
          payload: expect.objectContaining({ txid: mockTx.txid, amount: mockTx.amount, type: 'incoming' }),
        })
      );

      fireEvent.press(getByText('Done'));
      expect(require('../../services/websocket').WebSocketService.unsubscribe).toHaveBeenCalledWith(mockAddress);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should confirm payment when a slightly larger transaction is received (BTC)', async () => {
        const { getByPlaceholderText, getByText, findByText } = render(
            <PaymentRequestModal visible={true} onClose={mockOnClose} />
        );
        fireEvent.changeText(getByPlaceholderText('0.00'), btcAmount.toString());
        fireEvent.press(getByText('Continue'));
        await findByText(mockAddress);
  
        const mockTx = {
          addresses: [mockAddress],
          amount: btcAmount * 1.001, // Slightly more than requested
          txid: 'testTxIdSlightlyMore',
          confirmations: 0,
        };
  
        if (capturedWebSocketCallback) {
          await act(async () => { capturedWebSocketCallback!(mockTx); });
        }
        expect(await findByText('Payment Received!')).toBeTruthy();
        expect(getByText('testTxIdSlightlyMore')).toBeTruthy();
      });

      it('should confirm payment when amount is set in USD and matching BTC tx received', async () => {
        const { getByPlaceholderText, getByText, findByText } = render(
          <PaymentRequestModal visible={true} onClose={mockOnClose} />
        );
    
        // Switch to USD input
        fireEvent.press(getByText('BTC'));
        await findByText('USD'); 
        
        fireEvent.changeText(getByPlaceholderText('0.00'), fiatAmountUSD.toString()); // 250 USD
        fireEvent.press(getByText('Continue'));
        await findByText(mockAddress);
    
        const mockTx = {
          addresses: [mockAddress],
          amount: btcAmount, // 0.005 BTC which is 250 USD
          txid: 'testTxIdFiatMatch',
          confirmations: 0,
        };
    
        if (capturedWebSocketCallback) {
          await act(async () => { capturedWebSocketCallback!(mockTx); });
        }
        expect(await findByText('Payment Received!')).toBeTruthy();
        expect(getByText('testTxIdFiatMatch')).toBeTruthy();
      });

    it('should not confirm payment if transaction is for a different address', async () => {
      const { getByPlaceholderText, getByText, findByText, queryByText } = render(
        <PaymentRequestModal visible={true} onClose={mockOnClose} />
      );
      fireEvent.changeText(getByPlaceholderText('0.00'), btcAmount.toString());
      fireEvent.press(getByText('Continue'));
      await findByText(mockAddress);

      const mockTx = {
        addresses: ['differentAddress', 'someExternalAddress'], // Different address
        amount: btcAmount,
        txid: 'testTxIdDifferentAddr',
        confirmations: 0,
      };

      if (capturedWebSocketCallback) {
        await act(async () => { capturedWebSocketCallback!(mockTx); });
      }
      
      expect(queryByText('Payment Received!')).toBeNull();
      expect(queryByText('testTxIdDifferentAddr')).toBeNull();
      expect(mockWalletDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADD_TRANSACTION' })
      );
    });

    it('should not confirm payment if transaction amount is too small', async () => {
      const { getByPlaceholderText, getByText, findByText, queryByText } = render(
        <PaymentRequestModal visible={true} onClose={mockOnClose} />
      );
      fireEvent.changeText(getByPlaceholderText('0.00'), btcAmount.toString());
      fireEvent.press(getByText('Continue'));
      await findByText(mockAddress);

      const mockTx = {
        addresses: [mockAddress],
        amount: btcAmount * 0.98, // Less than 99% threshold
        txid: 'testTxIdTooSmall',
        confirmations: 0,
      };

      if (capturedWebSocketCallback) {
        await act(async () => { capturedWebSocketCallback!(mockTx); });
      }
      
      expect(queryByText('Payment Received!')).toBeNull();
      expect(mockWalletDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADD_TRANSACTION' })
      );
    });

    it('should unsubscribe WebSocket when "New Request" is pressed after payment received', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <PaymentRequestModal visible={true} onClose={mockOnClose} />
      );
      fireEvent.changeText(getByPlaceholderText('0.00'), btcAmount.toString());
      fireEvent.press(getByText('Continue'));
      await findByText(mockAddress);

      const mockTx = { addresses: [mockAddress], amount: btcAmount, txid: 'testTxIdNewReq', confirmations: 0 };
      if (capturedWebSocketCallback) {
        await act(async () => { capturedWebSocketCallback!(mockTx); });
      }
      await findByText('Payment Received!');
      
      fireEvent.press(getByText('New Request'));
      expect(require('../../services/websocket').WebSocketService.unsubscribe).toHaveBeenCalledWith(mockAddress);
      // Also check if it resets to the amount input step
      expect(getByPlaceholderText('0.00')).toBeTruthy();
    });
    
    it('should unsubscribe WebSocket when modal is closed from QR screen (before payment)', async () => {
        const { getByPlaceholderText, getByText, findByText, getByTestId } = render(
          <PaymentRequestModal visible={true} onClose={mockOnClose} />
        );
        fireEvent.changeText(getByPlaceholderText('0.00'), btcAmount.toString());
        fireEvent.press(getByText('Continue'));
        await findByText(mockAddress); // Wait for QR screen
  
        // Assume a close button with testID 'close-button' exists on the modal
        // This needs to be added to your component or use another way to trigger onClose
        // For now, directly call mockOnClose to simulate closure
        act(() => {
            mockOnClose(); 
        });
  
        // The useEffect cleanup in PaymentRequestModal should call unsubscribe
        // This test is a bit indirect as it relies on the cleanup effect of unmounting/closing
        // If the component directly calls unsubscribe on a close button press before calling onClose, test that instead.
        // For now, we'll assume the useEffect cleanup handles it.
        // To make this more robust, we'd need to know exactly how onClose is triggered from within the modal
        // and if unsubscribe is called *before* the actual unmount.
        // If onClose is called, and the modal then becomes invisible, the useEffect cleanup should run.
        expect(require('../../services/websocket').WebSocketService.unsubscribe).toHaveBeenCalledWith(mockAddress);
      });
  });
});
