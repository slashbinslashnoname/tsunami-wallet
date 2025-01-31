import bs58 from 'bs58';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { XPubData } from '../types/bitcoin';

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

export const XPubService = {
  convertToXPub(input: string): string {
    const decoded = bs58.decode(input);
    const version = decoded.slice(0, 4).toString('hex');
    
    // Already an xpub
    if (version === VERSIONS.xpub.public) {
      return input;
    }

    // Replace version bytes with xpub version
    const xpubVersion = Buffer.from(VERSIONS.xpub.public, 'hex');
    const newXpub = Buffer.concat([xpubVersion, decoded.slice(4)]);
    
    // Calculate new checksum
    const payload = newXpub.slice(0, -4);
    const doubleHash = sha256(sha256.create().update(new Uint8Array(payload)).digest());
    const checksum = Buffer.from(doubleHash).slice(0, 4);
    
    // Combine payload and checksum
    const final = Buffer.concat([payload, checksum]);
    
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
      console.error('XPub validation error:', error);
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
  }
}; 