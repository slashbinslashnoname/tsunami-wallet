import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory, ECPairInterface } from 'ecpair';
import * as secp256k1 from '@bitcoinerlab/secp256k1';

const ECPair = ECPairFactory(secp256k1);

export interface KeyPairResult {
  privateKey: string;
  publicKey: string;
  address: string;
}

/**
 * Service for handling Bitcoin-related operations
 */
export class BitcoinService {
  private readonly network: bitcoin.networks.Network;

  constructor() {
    this.network = bitcoin.networks.bitcoin;
  }

  /**
   * Generates a new Bitcoin key pair and address
   * @returns Object containing private key, public key and address
   * @throws Error if address generation fails
   */
  public generateKeyPair(): KeyPairResult {
    console.log('Generating key pair');
    try {
      const keyPair: ECPairInterface = ECPair.makeRandom({ network: this.network });
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: this.network,
      });

      if (!address) {
        throw new Error('Failed to generate address');
      }

      return {
        privateKey: keyPair.toWIF(),
        publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
        address,
      };
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw error;
    }
  }
} 