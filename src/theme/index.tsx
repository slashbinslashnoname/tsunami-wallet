import { useColorScheme } from 'react-native';

type Theme = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  white: string;
  black: string;
  text: {
    primary: string;
    secondary: string;
  };
  border: string;
  error: string;
  success: string;
  card: {
    background: string;
    border: string;
    shadow: string;
  };
};

export const colors = {
  light: {
    primary: '#8B1E3F',
    secondary: '#641220',
    background: '#F8F9FB',
    surface: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    text: {
      primary: '#1A1A1A',
      secondary: '#757575',
    },
    border: '#E0E0E0',
    error: '#DC2626',
    success: '#16A34A',
    card: {
      background: '#FFFFFF',
      border: '#F4F4F5',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  },
  dark: {
    primary: '#FF3366',
    secondary: '#FF1744',
    background: '#121212',
    surface: '#1E1E1E',
    white: '#FFFFFF',
    black: '#000000',
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A0',
    },
    border: '#2C2C2C',
    error: '#FF1744',
    success: '#00E676',
    card: {
      background: '#1E1E1E',
      border: '#2C2C2C',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  }
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

export const typography = (theme: Theme) => ({
  heading: {
    fontSize: 28,
    color: theme.text.primary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 20,
    color: theme.text.primary,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    color: theme.text.primary,
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 14,
    color: theme.text.secondary,
    letterSpacing: -0.1,
  },
  button: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
});

export const shadows = (theme: Theme) => ({
  small: {
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
});

export const layout = (theme: Theme) => ({
  card: {
    backgroundColor: theme.card.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows(theme).medium,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
});

// Create a type-safe hook for theme
export const useTheme = () => {
  const colorScheme = useColorScheme();
  return {
    colors: colors[colorScheme === 'dark' ? 'dark' : 'light'],
    spacing,
    typography: typography(colors[colorScheme === 'dark' ? 'dark' : 'light']),
    layout: layout(colors[colorScheme === 'dark' ? 'dark' : 'light']),
    borderRadius,
    shadows: shadows(colors[colorScheme === 'dark' ? 'dark' : 'light'])
  };
}; 