export interface XPubData {
  xpub: string;
  format: 'xpub' | 'ypub' | 'zpub';
  derivationPath: string;
  network: 'mainnet' | 'testnet';
}

export interface Balance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface Transaction {
  txid: string;
  amount: number;
  confirmations: number;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  addresses: string[];
  status: 'pending' | 'confirmed';
}

export interface AddressData {
  address: string;
  path: string;
  index: number;
  balance: number;
  isChange: boolean;
  transactions: Transaction[];
}

export interface PaymentRequest {
  amount: number;
  currency: 'BTC' | 'EUR' | 'USD';
  address: string;
  label?: string;
  message?: string;
} 