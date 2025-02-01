import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from '../services/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  currentTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    // Load saved theme preference
    StorageService.getThemeMode().then(savedTheme => {
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await StorageService.saveThemeMode(mode);
  };

  const currentTheme = themeMode === 'system' 
    ? systemTheme || 'light'
    : themeMode;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
} 