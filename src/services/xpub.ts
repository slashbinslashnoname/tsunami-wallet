import bs58 from 'bs58';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { XPubData } from '../types/bitcoin';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const VERSIONS = {
  xpub: {
    public: '0488b21e',
    private: '0488ade4',
  },
  ypub: {
    public: '049d7cb2',
    private: '049d7878',
  },
  zpub: {
    public: '04b24746',
    private: '04b2430c',
  }
};

const bip32 = BIP32Factory(ecc);

export const XPubService = {
  convertToXPub(input: string): string {
    const decoded = bs58.decode(input);
    const version = decoded.slice(0, 4).toString('hex');
    
    // Already a zpub
    if (version === VERSIONS.zpub.public) {
      return input;
    }

    // Replace version bytes with zpub version
    const zpubVersion = Buffer.from(VERSIONS.zpub.public, 'hex');
    const newZpub = Buffer.concat([zpubVersion, decoded.slice(4)]);
    
    // Calculate new checksum
    const payload = newZpub.slice(0, -4);
    const doubleHash = sha256(sha256(payload));
    const checksum = Buffer.from(doubleHash).slice(0, 4);
    
    // Combine payload and checksum
    const final = Buffer.concat([newZpub.slice(0, -4), checksum]);
    
    return bs58.encode(final);
  },

  validateFormat(input: string): XPubData['format'] | null {
    try {
      const decoded = bs58.decode(input);
      if (decoded.length !== 82) return null;

      const version = Buffer.from(decoded.slice(0, 4)).toString('hex');
      
      if (version === VERSIONS.zpub.public) return 'zpub';
      if (version === VERSIONS.ypub.public) return 'ypub';
      if (version === VERSIONS.xpub.public) return 'xpub';
      
      return null;
    } catch (error) {
      return null;
    }
  },

  parseXPub(input: string): XPubData {
    const format = this.validateFormat(input);
    
    if (!format) {
      throw new Error('Invalid extended public key format. Please provide a valid xpub, ypub, or zpub');
    }

    return {
      xpub: input,
      format,
      derivationPath: format === 'xpub' ? "m/44'/0'/0'" : 
                     format === 'ypub' ? "m/49'/0'/0'" :
                     "m/84'/0'/0'",
      network: 'mainnet'
    };
  },


  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  },

  async mnemonicToXpub(mnemonic: string): Promise<string> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed);
    const path = "m/84'/0'/0'"; // Native SegWit (zpub)
    const account = root.derivePath(path);
    const xpub = account.neutered().toBase58();

    // Convert to zpub
    return this.convertToXPub(xpub);
  },
}; 