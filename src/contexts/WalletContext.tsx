import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { XPubData, Balance, Transaction } from '../types/bitcoin';
import { StorageService } from '../services/storage';
import { AddressService } from '../services/address';
import { WalletService } from '../services/wallet';
import { AddressData } from '../types/bitcoin';
import { TransactionService } from '../services/transaction';

interface WalletState {
  transactions: Transaction[];
  balance: Balance;
  addresses: AddressData[];
  isLoading: boolean;
  xpubData: XPubData | null;
  index: number;
  isRefreshing: boolean;
  mnemonic: string | null;
  hasFullWallet: boolean; // Flag to indicate if we have a full wallet with private keys
  selectedAddressType: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh';
  feeRates: { slow: number; medium: number; fast: number } | null;
  isSendingTransaction: boolean;
  hasPrivateKey: boolean;
}

type WalletAction =
  | { type: 'SET_XPUB'; payload: XPubData }
  | { type: 'SET_BALANCE'; payload: Balance }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_ADDRESSES'; payload: string[] }
  | { type: 'SET_INDEX'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'REFRESH' }
  | { type: 'RESET' }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_MNEMONIC'; payload: string }
  | { type: 'SET_HAS_FULL_WALLET'; payload: boolean }
  | { type: 'SET_ADDRESS_TYPE'; payload: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' }
  | { type: 'SET_FEE_RATES'; payload: { slow: number; medium: number; fast: number } }
  | { type: 'SET_SENDING_TRANSACTION'; payload: boolean }
  | { type: 'SET_HAS_PRIVATE_KEY'; payload: boolean };

const initialState: WalletState = {
  xpubData: null,
  balance: {
    confirmed: 0,
    unconfirmed: 0
  },
  transactions: [],
  addresses: [],
  index: 0,
  isLoading: true,
  isRefreshing: false,
  mnemonic: null,
  hasFullWallet: false,
  selectedAddressType: 'p2wpkh', // Default to native SegWit (most efficient)
  feeRates: null,
  isSendingTransaction: false,
  hasPrivateKey: false,
};

const WalletContext = createContext<{
  state: WalletState;
  dispatch: React.Dispatch<WalletAction>;
  sendTransaction: (toAddress: string, amountBTC: number, feeRate: number) => Promise<string>;
} | undefined>(undefined);

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_XPUB':
      return { 
        ...state, 
        xpubData: action.payload,
        // If xpubData has a mnemonic, set hasFullWallet to true
        hasFullWallet: !!action.payload.mnemonic,
        // If xpubData has a mnemonic, update our mnemonic too
        mnemonic: action.payload.mnemonic || state.mnemonic
      };
    case 'SET_BALANCE':
      return {
        ...state,
        balance: {
          confirmed: action.payload.confirmed,
          unconfirmed: action.payload.unconfirmed + state.transactions
            .filter(tx => tx.status === 'pending' && tx.type === 'incoming')
            .reduce((sum, tx) => sum + tx.amount, 0)
        }
      };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_ADDRESSES':
      return { ...state, addresses: action.payload.map(address => ({ ...address, address })) };
    case 'SET_INDEX':
      return { ...state, index: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'REFRESH':
      return { ...state, isRefreshing: state.isRefreshing ? false : true };
    case 'RESET':
      return { ...initialState, mnemonic: null, hasFullWallet: false };
    case 'ADD_TRANSACTION':
      const isIncoming = action.payload.type === 'incoming';
      const amount = action.payload.amount;
      const isConfirmed = action.payload.confirmations > 0;

      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        balance: {
          confirmed: isConfirmed ? 
            state.balance.confirmed + (isIncoming ? amount : -amount) : 
            state.balance.confirmed,
          unconfirmed: !isConfirmed && isIncoming ? 
            state.balance.unconfirmed + amount : 
            state.balance.unconfirmed
        }
      };
    case 'SET_MNEMONIC':
      return { ...state, mnemonic: action.payload, hasFullWallet: !!action.payload };
    case 'SET_HAS_FULL_WALLET':
      return { ...state, hasFullWallet: action.payload };
    case 'SET_ADDRESS_TYPE':
      return { ...state, selectedAddressType: action.payload };
    case 'SET_FEE_RATES':
      return { ...state, feeRates: action.payload };
    case 'SET_SENDING_TRANSACTION':
      return { ...state, isSendingTransaction: action.payload };
    case 'SET_HAS_PRIVATE_KEY':
      return { ...state, hasPrivateKey: action.payload };
    default:
      return state;
  }
}

export function WalletProvider({ 
  children, 
  initialXpubData = null 
}: { 
  children: React.ReactNode;
  initialXpubData?: XPubData | null;
}) {
  const [state, dispatch] = useReducer(walletReducer, {
    ...initialState,
    xpubData: initialXpubData
  });

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const xpubData = await StorageService.getXPubData();
      if (xpubData) {
        dispatch({ type: 'SET_XPUB', payload: xpubData });
        
        // If there's a mnemonic, we have a full wallet
        if (xpubData.mnemonic) {
          dispatch({ type: 'SET_HAS_FULL_WALLET', payload: true });
        }
        
        await refreshWalletData(xpubData.xpub);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function refreshWalletData(xpub: string) {
    try {
      const xpubData = createXpubData(xpub);
      const { allAddresses, allTransactions, lastIndex } = await deriveAndFetchData(xpubData);

      updateWalletState(allAddresses, allTransactions, lastIndex);
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }

  function createXpubData(xpub: string): XPubData {
    const format = AddressService.detectXpubFormat(xpub);
    // Make sure we preserve the mnemonic when re-creating XPubData
    // This is crucial because when refreshWalletData is called, it creates
    // a new XPubData that doesn't include any existing mnemonic
    return { 
      xpub, 
      format, 
      derivationPath: '', 
      network: 'mainnet' as 'mainnet' | 'testnet',
      mnemonic: state.xpubData?.mnemonic || null
    };
  }

  async function deriveAndFetchData(xpubData: XPubData) {
    let allAddresses: AddressData[] = [];
    let allTransactions: Transaction[] = [];
    let start = 0;
    const batchSize = 50;
    let foundEmptyAddress = false;
    let lastIndex = 0;

    while (!foundEmptyAddress) {
      const { addresses, transactions } = await fetchBatchData(xpubData, start, batchSize);
      const addressesWithBalance = calculateBalances(addresses, transactions);

      const emptyAddressIndex = addressesWithBalance.findIndex(addr => addr.balance === 0);
      if (emptyAddressIndex !== -1) {
        foundEmptyAddress = true;
        lastIndex = start + emptyAddressIndex;
      }

      allAddresses = allAddresses.concat(addressesWithBalance);
      allTransactions = allTransactions.concat(transactions);

      if (transactions.length < batchSize || foundEmptyAddress) {
        break;
      }

      start += batchSize;
    }

    if (!foundEmptyAddress) {
      lastIndex = allAddresses.length;
    }

    return { allAddresses, allTransactions, lastIndex };
  }

  async function fetchBatchData(xpubData: XPubData, start: number, batchSize: number) {
    const addresses = await AddressService.deriveAddresses(xpubData, start, start + batchSize);
    const transactions = await AddressService.getXpubTransactions(addresses);
    return { addresses, transactions };
  }

  function calculateBalances(addresses: AddressData[], transactions: Transaction[]) {
    return addresses.map(address => {
      const addressTransactions = transactions.filter(tx => tx.addresses.includes(address.address));
      const balance = addressTransactions.reduce((acc, tx) => {
        return tx.type === 'incoming' ? acc + Math.abs(tx.amount) : acc - Math.abs(tx.amount);
      }, 0);
      return { ...address, balance };
    });
  }

  function updateWalletState(allAddresses: AddressData[], allTransactions: Transaction[], lastIndex: number) {
    dispatch({ type: 'SET_INDEX', payload: lastIndex });
    dispatch({ type: 'SET_ADDRESSES', payload: allAddresses.map(address => address.address) });
    dispatch({ type: 'SET_TRANSACTIONS', payload: allTransactions });

    const { confirmed, unconfirmed } = calculateTotalBalance(allTransactions);
    dispatch({ type: 'SET_BALANCE', payload: { confirmed, unconfirmed } });
    
    // Ensure hasFullWallet is set correctly based on mnemonic presence
    if (state.xpubData?.mnemonic) {
      dispatch({ type: 'SET_HAS_FULL_WALLET', payload: true });
      dispatch({ type: 'SET_MNEMONIC', payload: state.xpubData.mnemonic });
    }
  }

  function calculateTotalBalance(transactions: Transaction[]) {
    return transactions.reduce((acc, tx) => {
      const amount = tx.type === 'incoming' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      if (tx.status === 'confirmed') {
        acc.confirmed += amount;
      } else {
        acc.unconfirmed += amount;
      }
      return acc;
    }, { confirmed: 0, unconfirmed: 0 });
  }

  useEffect(() => {
    if (state.isRefreshing) {
      refreshWalletData(state.xpubData?.xpub || '');
    }
  }, [state.isRefreshing]);

  // Send Bitcoin transaction
  async function sendTransaction(
    toAddress: string, 
    amountBTC: number, 
    feeRate: number
  ): Promise<string> {
    if (!state.xpubData) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      dispatch({ type: 'SET_SENDING_TRANSACTION', payload: true });
      
      // Send the transaction
      const txid = await TransactionService.sendTransaction(
        toAddress,
        amountBTC,
        feeRate,
        state.xpubData
      );
      
      // Create a new transaction object for the UI
      const newTx: Transaction = {
        txid,
        amount: amountBTC,
        confirmations: 0,
        timestamp: Date.now(),
        type: 'outgoing',
        addresses: [toAddress],
        status: 'pending',
        fee: feeRate * 0.000001 // Approximate fee in BTC
      };
      
      // Add the transaction to the state
      dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
      
      // Save the recipient address to recent addresses
      await StorageService.addRecentAddress({ address: toAddress, label: '', timestamp: Date.now() });
      
      return txid;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SENDING_TRANSACTION', payload: false });
    }
  }

  return (
    <WalletContext.Provider value={{ 
      state, 
      dispatch,
      sendTransaction
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 