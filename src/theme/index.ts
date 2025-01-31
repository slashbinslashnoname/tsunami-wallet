export const colors = {
  primary: '#8B1E3F',
  secondary: '#641220',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  text: {
    primary: '#1A1A1A',
    secondary: '#71717A',
    disabled: '#A1A1AA',
  },
  border: '#E4E4E7',
  error: '#EF4444',
  success: '#10B981',
  accent: {
    red: '#8B1E3F',
    darkRed: '#641220',
    wine: '#4A0F20',
    burgundy: '#2E0A14',
  },
  card: {
    background: '#FFFFFF',
    border: '#F4F4F5',
    shadow: 'rgba(0, 0, 0, 0.05)',
  },
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