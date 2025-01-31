/**
 * Crypto setup for React Native
 * Must be imported before any crypto operations
 */
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';
import { sha256 } from '@noble/hashes/sha256';

declare global {
  // eslint-disable-next-line no-var
  var Buffer: any;
  // eslint-disable-next-line no-var
  var process: any;
}

global.Buffer = Buffer;
global.process = process;

// Replace node's crypto with our implementation
const crypto = {
  createHash: (algorithm: string) => {
    if (algorithm !== 'sha256') {
      throw new Error('Only SHA256 is supported');
    }
    
    let data = Buffer.alloc(0);
    
    return {
      update: (input: Buffer | string) => {
        data = Buffer.concat([data, Buffer.from(input)]);
        return this;
      },
      digest: () => {
        return Buffer.from(sha256(data));
      }
    };
  }
};

global.crypto = crypto as any; 