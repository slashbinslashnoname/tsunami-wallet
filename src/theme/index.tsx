import React, { useState, useContext } from 'react';

export const colors = {
  
    primary: '#1E88E5',
    background: '#F5F5F5',
    card: {
      background: '#FFFFFF',
      border: '#E0E0E0',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    success: '#4CAF50',
    error: '#F44336',
    shadow: '#000000',
    white: '#FFFFFF',
    black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: -0.1,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
};

export const shadows = {
  small: {
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const layout = {
  card: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Add theme context
export const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {},
});

// Add theme provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? colors.dark : colors.light;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Add theme hook
export function useTheme() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const theme = isDark ? colors.dark : colors.light;
  return { theme, isDark, toggleTheme };
} 