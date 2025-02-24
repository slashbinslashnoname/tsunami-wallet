import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { ExchangeService } from '../services/exchange';
import { Settings } from '../types/bitcoin';

interface SettingsContextType {
  settings: Settings;
  updateCurrency: (currency: Settings['currency']) => void;
  refreshRates: () => Promise<void>;
}

const defaultSettings: Settings = {
  currency: 'BTC',
  exchangeRates: {
    USD: 0,
    EUR: 0
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await StorageService.getSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
    refreshRates();
  };

  const updateCurrency = async (currency: Settings['currency']) => {
    const newSettings = { ...settings, currency };
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  const refreshRates = async () => {
    const rates = await ExchangeService.fetchRates();
    const newSettings = { ...settings, exchangeRates: rates };
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateCurrency, refreshRates }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 