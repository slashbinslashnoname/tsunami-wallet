import * as SecureStore from 'expo-secure-store';
import { XPubData } from '../types/bitcoin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XPUB_STORAGE_KEY = 'wallet_xpub_data';
const THEME_MODE_KEY = 'themeMode';

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
  },

  saveThemeMode: async (mode: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  },

  getThemeMode: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(THEME_MODE_KEY);
    } catch (error) {
      console.error('Error getting theme mode:', error);
      return null;
    }
  },
}; 