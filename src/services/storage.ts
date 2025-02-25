import * as SecureStore from 'expo-secure-store';
import { XPubData } from '../types/bitcoin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XPUB_STORAGE_KEY = 'wallet_xpub_data';
const THEME_MODE_KEY = 'themeMode';
const ADDRESS_TYPE_KEY = 'address_type';
const RECENT_ADDRESSES_KEY = 'recent_addresses';

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
  
  async saveAddressType(type: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh'): Promise<void> {
    try {
      await AsyncStorage.setItem(ADDRESS_TYPE_KEY, type);
    } catch (error) {
      console.error('Error saving address type:', error);
      throw new Error('Failed to save address type');
    }
  },
  
  async getAddressType(): Promise<'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | null> {
    try {
      const type = await AsyncStorage.getItem(ADDRESS_TYPE_KEY);
      if (type === 'p2pkh' || type === 'p2sh-p2wpkh' || type === 'p2wpkh') {
        return type;
      }
      return null;
    } catch (error) {
      console.error('Error getting address type:', error);
      return null;
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

  async addRecentAddress(addressData: { address: string; label: string; timestamp: number }): Promise<void> {
    try {
      // Get existing recent addresses
      const addresses = await this.getRecentAddresses();
      
      // Check if address already exists
      const existingIndex = addresses.findIndex(a => a.address === addressData.address);
      
      if (existingIndex !== -1) {
        // Update existing address
        addresses[existingIndex] = {
          ...addresses[existingIndex],
          ...addressData,
          timestamp: Date.now()
        };
      } else {
        // Add new address
        addresses.unshift(addressData);
        
        // Limit to 10 recent addresses
        if (addresses.length > 10) {
          addresses.pop();
        }
      }
      
      // Save updated addresses
      await AsyncStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error adding recent address:', error);
    }
  },

  async getRecentAddresses(): Promise<Array<{ address: string; label: string; timestamp: number }>> {
    try {
      const data = await AsyncStorage.getItem(RECENT_ADDRESSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting recent addresses:', error);
      return [];
    }
  },
}; 