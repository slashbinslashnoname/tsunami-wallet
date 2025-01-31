import * as SecureStore from 'expo-secure-store';
import { XPubData } from '../types/bitcoin';

const XPUB_STORAGE_KEY = 'wallet_xpub_data';

export const StorageService = {
  async saveXPubData(data: XPubData): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        XPUB_STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error saving XPub data:', error);
      throw new Error('Failed to save XPub data securely');
    }
  },

  async getXPubData(): Promise<XPubData | null> {
    try {
      const data = await SecureStore.getItemAsync(XPUB_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading XPub data:', error);
      throw new Error('Failed to read XPub data');
    }
  },

  async removeXPubData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(XPUB_STORAGE_KEY);
    } catch (error) {
      console.error('Error removing XPub data:', error);
      throw new Error('Failed to remove XPub data');
    }
  }
}; 