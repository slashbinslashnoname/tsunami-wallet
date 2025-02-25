import * as bip39 from 'bip39';
import * as ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import { XPubData, Transaction, AddressData } from '../types/bitcoin';
import { AddressService } from './address';

// Initialize bip32 with secp256k1
const bip32 = BIP32Factory(ecc);

export const WalletService = {
  generateMnemonic(): string {
    return bip39.generateMnemonic(256); // Generate a 24-word mnemonic
  },

  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  },

  async mnemonicToSeed(mnemonic: string): Promise<Buffer> {
    return bip39.mnemonicToSeed(mnemonic);
  },

  deriveKeysFromMnemonic: async (mnemonic: string, addressType: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' = 'p2wpkh') => {
    try {
      // Validate the mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Convert mnemonic to seed
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // Derive root node
      const root = bip32.fromSeed(seed);
      
      // Determine path based on address type
      let path = '';
      let xpubFormat: XPubData['format'] = 'xpub';
      
      switch (addressType) {
        case 'p2pkh': // Legacy
          path = "m/44'/0'/0'";
          xpubFormat = 'xpub';
          break;
        case 'p2sh-p2wpkh': // SegWit-compatible (nested SegWit)
          path = "m/49'/0'/0'";
          xpubFormat = 'ypub';
          break;
        case 'p2wpkh': // Native SegWit
          path = "m/84'/0'/0'";
          xpubFormat = 'zpub';
          break;
        default:
          throw new Error('Invalid address type');
      }
      
      // Derive account node
      const accountNode = root.derivePath(path);
      
      // Derive xpub
      const xpub = accountNode.neutered().toBase58();
      
      // Create XPubData object
      const xpubData: XPubData = {
        xpub,
        format: xpubFormat,
        derivationPath: path,
        network: 'mainnet',
        mnemonic
      };
      
      return xpubData;
    } catch (error) {
      console.error('Error deriving keys from mnemonic:', error);
      throw new Error('Failed to derive keys from mnemonic');
    }
  },

  // Create a transaction
  async createTransaction(
    xpubData: XPubData, 
    recipientAddress: string, 
    amountInSatoshis: number, 
    feeRate: number = 10 // sat/byte
  ): Promise<{ txHex: string; fee: number }> {
    try {
      if (!xpubData.mnemonic) {
        throw new Error('Cannot create transaction: mnemonic not available');
      }
      
      // Convert mnemonic to seed
      const seed = await bip39.mnemonicToSeed(xpubData.mnemonic);
      
      // Derive root node
      const root = bip32.fromSeed(seed);
      
      // Determine network and address type based on xpub format
      const network = bitcoin.networks.bitcoin;
      
      // Create psbt (Partially Signed Bitcoin Transaction)
      const psbt = new bitcoin.Psbt({ network });
      
      // TODO: Implement UTXO selection, input signing, and fee calculation
      // This is a placeholder for the actual transaction creation logic
      // which would require querying for UTXOs and properly building the transaction
      
      throw new Error('Transaction creation not yet implemented');
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Convert from one xpub format to another
  convertXpubFormat(xpub: string, targetFormat: XPubData['format']): string {
    const currentFormat = AddressService.detectXpubFormat(xpub);
    
    if (currentFormat === targetFormat) {
      return xpub;
    }
    
    let targetVersionHex = '';
    switch (targetFormat) {
      case 'xpub':
        targetVersionHex = '0488b21e';
        break;
      case 'ypub':
        targetVersionHex = '049d7cb2';
        break;
      case 'zpub':
        targetVersionHex = '04b24746';
        break;
      default:
        throw new Error('Invalid target format');
    }
    
    return AddressService.convertExtendedKey(xpub, targetVersionHex);
  }
};