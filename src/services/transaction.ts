import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory from 'bip32';
import * as bip39 from 'bip39';
import { XPubData, UTXO, Transaction } from '../types/bitcoin';
import { StorageService } from './storage';
import { WalletService } from './wallet';

// Initialize required libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

export const TransactionService = {
  // Fetch fee rates from mempool.space API
  async fetchFeeRates(): Promise<{ slow: number; medium: number; fast: number }> {
    try {
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      const data = await response.json();
      
      return {
        slow: data.hourFee,
        medium: data.halfHourFee,
        fast: data.fastestFee
      };
    } catch (error) {
      console.error('Error fetching fee rates:', error);
      // Return default values if API fails
      return {
        slow: 5,
        medium: 10,
        fast: 20
      };
    }
  },
  
  // Send a Bitcoin transaction
  async sendTransaction(
    toAddress: string,
    amountBTC: number,
    feeRate: number,
    xpubData: XPubData
  ): Promise<string> {
    try {
      // Get mnemonic from secure storage
      const mnemonic = await StorageService.getMnemonic();
      
      if (!mnemonic) {
        throw new Error('Cannot send transaction: private keys not available');
      }
      
      // Convert amount to satoshis
      const amountSats = Math.round(amountBTC * 100000000);
      
      // Get UTXOs for the wallet
      const utxos = await this.fetchUTXOs(xpubData);
      
      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available to spend');
      }
      
      // Derive a change address
      const changeAddress = await this.deriveChangeAddress(xpubData);
      
      // Build the transaction
      const { psbt, fee } = await this.buildTransaction(
        toAddress,
        amountSats,
        feeRate,
        changeAddress,
        utxos,
        xpubData
      );
      
      // Sign the transaction with the mnemonic
      const signedTx = await this.signTransaction(psbt, mnemonic, xpubData);
      
      // Broadcast the transaction
      const txid = await this.broadcastTransaction(signedTx.toHex());
      
      // Return the transaction ID
      return txid;
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  },
  
  // Fetch UTXOs for the wallet
  async fetchUTXOs(xpubData: XPubData): Promise<UTXO[]> {
    try {
      // For simplicity, we'll use a public API to fetch UTXOs
      // In a production app, you might want to use your own backend or a more reliable service
      const response = await fetch(`https://blockstream.info/api/address/${xpubData.xpub}/utxo`);
      const data = await response.json();
      
      return data.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: '', // This would need to be fetched separately
        address: '', // This would need to be derived
        confirmations: utxo.status.confirmed ? 1 : 0
      }));
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      throw new Error('Failed to fetch UTXOs');
    }
  },
  
  // Derive a change address
  async deriveChangeAddress(xpubData: XPubData): Promise<string> {
    try {
      // Derive a change address at index 0
      // In a real app, you'd want to derive a new unused address each time
      const changeIndex = 0;
      const path = `1/${changeIndex}`; // Change address path (m/84'/0'/0'/1/0)
      
      // If we have the mnemonic, derive directly
      const mnemonic = await StorageService.getMnemonic();
      if (mnemonic) {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seed);
        const derivationPath = xpubData.derivationPath;
        const accountPath = `${derivationPath}/1/${changeIndex}`;
        const keyPair = root.derivePath(accountPath);
        
        // Create address based on xpub format
        let address = '';
        switch (xpubData.format) {
          case 'xpub': // Legacy
            address = bitcoin.payments.p2pkh({ 
              pubkey: keyPair.publicKey 
            }).address || '';
            break;
          case 'ypub': // SegWit-compatible
            address = bitcoin.payments.p2sh({
              redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey })
            }).address || '';
            break;
          case 'zpub': // Native SegWit
            address = bitcoin.payments.p2wpkh({ 
              pubkey: keyPair.publicKey 
            }).address || '';
            break;
        }
        
        return address;
      }
      
      throw new Error('Cannot derive change address: mnemonic not available');
    } catch (error) {
      console.error('Error deriving change address:', error);
      throw new Error('Failed to derive change address');
    }
  },
  
  // Build a transaction
  async buildTransaction(
    toAddress: string,
    amountSats: number,
    feeRate: number,
    changeAddress: string,
    utxos: UTXO[],
    xpubData: XPubData
  ): Promise<{ psbt: bitcoin.Psbt; fee: number }> {
    try {
      // Create a new PSBT
      const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
      
      // Sort UTXOs by value (largest first)
      const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
      
      // Select UTXOs to cover the amount plus estimated fee
      let selectedUtxos: UTXO[] = [];
      let totalInput = 0;
      let estimatedSize = 0;
      let estimatedFee = 0;
      
      for (const utxo of sortedUtxos) {
        selectedUtxos.push(utxo);
        totalInput += utxo.value;
        
        // Update estimated size and fee
        estimatedSize = this.estimateTransactionSize(selectedUtxos.length, 2); // 2 outputs: recipient and change
        estimatedFee = estimatedSize * feeRate;
        
        // Check if we have enough funds
        if (totalInput >= amountSats + estimatedFee) {
          break;
        }
      }
      
      // Check if we have enough funds
      if (totalInput < amountSats + estimatedFee) {
        throw new Error('Insufficient funds to cover amount and fee');
      }
      
      // Calculate change amount
      const changeAmount = totalInput - amountSats - estimatedFee;
      
      // Add inputs to PSBT
      for (const utxo of selectedUtxos) {
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(utxo.scriptPubKey, 'hex'),
            value: utxo.value
          }
        });
      }
      
      // Add recipient output
      psbt.addOutput({
        address: toAddress,
        value: amountSats
      });
      
      // Add change output if needed
      if (changeAmount > 546) { // Dust threshold
        psbt.addOutput({
          address: changeAddress,
          value: changeAmount
        });
      } else {
        // If change is dust, add it to the fee
        estimatedFee += changeAmount;
      }
      
      return { psbt, fee: estimatedFee };
    } catch (error) {
      console.error('Error building transaction:', error);
      throw new Error('Failed to build transaction');
    }
  },
  
  // Sign a transaction
  async signTransaction(
    psbt: bitcoin.Psbt,
    mnemonic: string,
    xpubData: XPubData
  ): Promise<bitcoin.Psbt> {
    try {
      // Convert mnemonic to seed
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // Derive root node
      const root = bip32.fromSeed(seed);
      
      // Sign each input
      for (let i = 0; i < psbt.inputCount; i++) {
        // In a real app, you'd need to derive the correct key for each input
        // This is simplified for demonstration
        const keyPair = root.derivePath(`${xpubData.derivationPath}/0/0`);
        psbt.signInput(i, keyPair);
      }
      
      // Finalize all inputs
      psbt.finalizeAllInputs();
      
      return psbt;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('Failed to sign transaction');
    }
  },
  
  // Broadcast a transaction
  async broadcastTransaction(txHex: string): Promise<string> {
    try {
      // For simplicity, we'll use a public API to broadcast the transaction
      // In a production app, you might want to use your own backend or a more reliable service
      const response = await fetch('https://blockstream.info/api/tx', {
        method: 'POST',
        body: txHex
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Broadcast failed: ${errorText}`);
      }
      
      // The response should be the transaction ID
      const txid = await response.text();
      return txid;
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw new Error('Failed to broadcast transaction');
    }
  },
  
  // Estimate transaction size in bytes
  estimateTransactionSize(inputCount: number, outputCount: number): number {
    // This is a simplified estimation for SegWit transactions
    // A more accurate estimation would depend on the specific input and output types
    const baseSize = 10; // Version + locktime
    const inputSize = 148; // Average size per input
    const outputSize = 34; // Average size per output
    
    return baseSize + (inputSize * inputCount) + (outputSize * outputCount);
  }
}; 