import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { XPubData, Balance, Transaction } from '../types/bitcoin';
import { StorageService } from '../services/storage';
import { AddressService } from '../services/address';
import { AddressData } from '../types/bitcoin';
import { WebSocketService } from '../services/websocket';

interface WalletState {
  transactions: Transaction[];
  balance: Balance;
  addresses: AddressData[];
  isLoading: boolean;
  xpubData: XPubData | null;
  error: string | null;
  index: number;
  isRefreshing: boolean;
}

type WalletAction =
  | { type: 'SET_XPUB'; payload: XPubData }
  | { type: 'SET_BALANCE'; payload: Balance }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_ADDRESSES'; payload: AddressData[] }
  | { type: 'SET_INDEX'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'REFRESH' }
  | { type: 'RESET' };

const initialState: WalletState = {
  transactions: [],
  addresses: [],
  balance: { confirmed: 0, unconfirmed: 0, total: 0 },
  isLoading: true,
  isRefreshing: false,
  index: 0,
  xpubData: null,
  error: null
};

const WalletContext = createContext<{
  state: WalletState;
  dispatch: React.Dispatch<WalletAction>;
} | undefined>(undefined);

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_XPUB':
      return { ...state, xpubData: action.payload };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_ADDRESSES':
      return { ...state, addresses: action.payload };
    case 'SET_INDEX':
      return { ...state, index: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'REFRESH':
      return { ...state, isRefreshing: state.isRefreshing ? false : true };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const xpubData = await StorageService.getXPubData();
      if (xpubData) {
        dispatch({ type: 'SET_XPUB', payload: xpubData });
        await refreshWalletData(xpubData.xpub);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load wallet data' });
    } finally {
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
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh wallet data' });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }

  function createXpubData(xpub: string): XPubData {
    const format = AddressService.detectXpubFormat(xpub);
    return { xpub, format, derivationPath: '', network: 'mainnet' as 'mainnet' | 'testnet' };
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
    dispatch({ type: 'SET_ADDRESSES', payload: allAddresses });
    dispatch({ type: 'SET_TRANSACTIONS', payload: allTransactions });

    const { confirmed, unconfirmed } = calculateTotalBalance(allTransactions);
    dispatch({ type: 'SET_BALANCE', payload: { confirmed, unconfirmed, total: confirmed + unconfirmed } });
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

  useEffect(() => {
    if (state.xpubData) {
      WebSocketService.subscribe((tx) => {
        // Check if transaction involves our addresses
        const isRelevant = tx.addresses.some(addr => 
          state.addresses.some(a => a.address === addr)
        );
        
        if (isRelevant) {
          dispatch({ type: 'REFRESH' });
        }
      });
    }

    return () => {
      WebSocketService.unsubscribe((tx) => {});
    };
  }, [state.xpubData, state.addresses]);

  return (
    <WalletContext.Provider value={{ state, dispatch }}>
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