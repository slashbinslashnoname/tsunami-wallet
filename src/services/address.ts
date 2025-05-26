import { Buffer } from 'buffer';
import * as ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import bs58 from 'bs58';
import { XPubData, AddressData, Transaction } from '../types/bitcoin';

// Initialize bip32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Define network parameters for different xpub versions
const NETWORK_VERSIONS = {
  xpub: {
    ...bitcoin.networks.bitcoin,
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
  },
  ypub: {
    ...bitcoin.networks.bitcoin,
    bip32: {
      public: 0x049d7cb2,
      private: 0x049d7878,
    },
  },
  zpub: {
    ...bitcoin.networks.bitcoin,
    bip32: {
      public: 0x04b24746,
      private: 0x04b2430c,
    },
  },
};

interface DerivationPath {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  index: number;
}

export const AddressService = {
  getDerivationPath(format: XPubData['format']): Pick<DerivationPath, 'purpose'> {
    switch (format) {
      case 'xpub': return { purpose: 44 };
      case 'ypub': return { purpose: 49 };
      case 'zpub': return { purpose: 84 };
      default: throw new Error('Invalid xpub format');
    }
  },

  async deriveAddresses(xpubData: XPubData, startIndex: number, count: number): Promise<AddressData[]> {
    const { format, xpub } = xpubData;
    const network = NETWORK_VERSIONS[format];
    const node = bip32.fromBase58(xpub, network);
    const addresses: AddressData[] = [];

    // Derive both receiving (0) and change (1) addresses
    for (const change of [0, 1]) {
      for (let i = startIndex; i < startIndex + count; i++) {
        const child = node.derive(change).derive(i);
        const pubkey = Buffer.from(child.publicKey);
        
        let address: string;
        if (format === 'zpub') {
          address = bitcoin.payments.p2wpkh({ 
            pubkey, 
            network: bitcoin.networks.bitcoin 
          }).address!;
        } else if (format === 'ypub') {
          const p2wpkh = bitcoin.payments.p2wpkh({ 
            pubkey, 
            network: bitcoin.networks.bitcoin 
          });
          address = bitcoin.payments.p2sh({
            redeem: p2wpkh,
            network: bitcoin.networks.bitcoin
          }).address!;
        } else {
          address = bitcoin.payments.p2pkh({ 
            pubkey, 
            network: bitcoin.networks.bitcoin 
          }).address!;
        }

        addresses.push({
          address,
          path: `${change}/${i}`,
          balance: 0,
          index: i,
          isChange: change === 1,
          transactions: []
        });
      }
    }

    return addresses;
  },

  convertExtendedKey(xpub: string, targetFormat: XPubData['format']): string {
    try {
      console.log(`[DEBUG convertExtendedKey] Input xpub: ${xpub}, TargetFormat: ${targetFormat}`);
      const decoded = bs58.decode(xpub) as Buffer; // Renamed to 'decoded' as per prompt's logging example
      const sourceHex = decoded.toString('hex');
      console.log(`[DEBUG convertExtendedKey] SourceHex (${sourceHex.length}): ${sourceHex}`); // Prompt uses raw length

      if (!NETWORK_VERSIONS[targetFormat]) {
        throw new Error(`Invalid target format: ${targetFormat}`);
      }
      const versionBytes = NETWORK_VERSIONS[targetFormat].bip32.public;
      const versionHex = versionBytes.toString(16).padStart(8, '0');
      console.log(`[DEBUG convertExtendedKey] VersionHex (${versionHex.length}): ${versionHex}`); // Prompt uses raw length

      // Refined logic application starts here, using prompt's variable names for clarity where possible
      if (decoded.length !== 82) {
          const errMsg = `Invalid xpub length: ${decoded.length}. Expected 82 bytes.`;
          console.error(`[DEBUG convertExtendedKey] ${errMsg}`); // Logging error as per prompt example
          throw new Error(errMsg);
      }
      const payload = decoded.slice(4, 78); // 74-byte payload
      
      const newVersionBuffer = Buffer.alloc(4);
      newVersionBuffer.writeUInt32BE(versionBytes, 0);

      const dataForNewChecksum = Buffer.concat([newVersionBuffer, payload]);
      // The prompt's log example for ConvertedHex and BufferForChecksum seems to refer to an older, flawed logic.
      // I will log the hex of dataForNewChecksum which is the important part for the refined logic.
      console.log(`[DEBUG convertExtendedKey] DataForNewChecksum hex (${dataForNewChecksum.length*2}): ${dataForNewChecksum.toString('hex')}`);
      console.log(`[DEBUG convertExtendedKey] BufferForChecksum length: ${dataForNewChecksum.length}`); // This is dataForNewChecksum
  
      const hash1 = bitcoin.crypto.sha256(dataForNewChecksum);
      const hash2 = bitcoin.crypto.sha256(hash1);
      const checksum = hash2.slice(0, 4); // Renamed to 'checksum' as per prompt's logging example
      console.log(`[DEBUG convertExtendedKey] Checksum: ${checksum.toString('hex')}`);
  
      const finalBuffer = Buffer.concat([dataForNewChecksum, checksum]);
      console.log(`[DEBUG convertExtendedKey] FinalBuffer for bs58encode length: ${finalBuffer.length} bytes`);
      
      const result = bs58.encode(finalBuffer);
      console.log(`[DEBUG convertExtendedKey] Result: ${result}`);
      return result;
  
    } catch (error: any) { // Explicitly type error as any or unknown
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[convertExtendedKey] Error during conversion:', errorMessage);
      // Consider re-throwing a more specific error or the original if it's already informative
      throw new Error(`Conversion failed: ${errorMessage}`);
    }
  }, // Added comma here

  detectXpubFormat(xpub: string): XPubData['format'] {
    if (xpub.startsWith('xpub')) return 'xpub';
    if (xpub.startsWith('ypub')) return 'ypub';
    if (xpub.startsWith('zpub')) return 'zpub';
    throw new Error('Invalid xpub format'); // Reverted to simpler version
  },

  async getXpubTransactions(addresses: AddressData[]): Promise<Transaction[]> {
    try {
      console.log("Pulling data from blockchain.info")
      const addressList = addresses.map(a => a.address);
      const url = `https://blockchain.info/multiaddr?active=${addressList.join('|')}&n=50`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.txs || !Array.isArray(data.txs)) {
        return [];
      }

      return data.txs
        .map((tx: any) => {
          // Check if any of our addresses are involved in inputs or outputs
          const hasInput = tx.inputs.some((input: any) => 
            addressList.includes(input.prev_out?.addr)
          );
          const hasOutput = tx.out.some((out: any) => 
            addressList.includes(out.addr)
          );

          // Skip transactions not involving our addresses
          if (!hasInput && !hasOutput) return null;

          // Calculate amounts received and sent by our addresses
          const amountReceived = tx.out.reduce((sum: number, out: any) => 
            addressList.includes(out.addr) ? sum + out.value : sum, 0) / 1e8;
          
          const amountSent = tx.inputs.reduce((sum: number, input: any) => 
            addressList.includes(input.prev_out?.addr) ? sum + (input.prev_out?.value || 0) : sum, 0) / 1e8;

          const netAmount = amountReceived - amountSent;
          const type = netAmount > 0 ? 'incoming' : 'outgoing';

          return {
            txid: tx.hash,
            amount: Math.abs(netAmount),
            confirmations: tx.block_height ? 1 : 0,
            timestamp: tx.time * 1000,
            type,
            addresses: [
              ...tx.inputs.map((input: any) => input.prev_out?.addr).filter(Boolean),
              ...tx.out.map((out: any) => out.addr).filter(Boolean)
            ],
            status: tx.block_height ? 'confirmed' : 'pending'
          };
        })
        .filter(Boolean) // Remove null transactions
        .sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching xpub transactions:', error);
      throw new Error('Failed to fetch xpub transactions');
    }
  },
}; 