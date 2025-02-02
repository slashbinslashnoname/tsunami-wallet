import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  currency: 'BTC' | 'USD' | 'EUR';
  notifications: boolean;
  autoRefresh: boolean;
}

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

type SettingsAction =
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'UPDATE_SETTING'; payload: Partial<Settings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

const initialSettings: Settings = {
  currency: 'USD',
  notifications: true,
  autoRefresh: true,
};

const initialState: SettingsState = {
  settings: initialSettings,
  isLoading: true,
  error: null,
};

const SettingsContext = createContext<{
  state: SettingsState;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
} | undefined>(undefined);

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload,
        isLoading: false,
      };
    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        dispatch({ type: 'SET_SETTINGS', payload: JSON.parse(savedSettings) });
      } else {
        dispatch({ type: 'SET_SETTINGS', payload: initialSettings });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load settings' 
      });
    }
  }

  async function updateSettings(newSettings: Partial<Settings>) {
    try {
      const updatedSettings = { ...state.settings, ...newSettings };
      await AsyncStorage.setItem('settings', JSON.stringify(updatedSettings));
      dispatch({ type: 'UPDATE_SETTING', payload: newSettings });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to update settings' 
      });
    }
  }

  async function resetSettings() {
    try {
      await AsyncStorage.removeItem('settings');
      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_SETTINGS', payload: initialSettings });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to reset settings' 
      });
    }
  }

  return (
    <SettingsContext.Provider value={{ state, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 