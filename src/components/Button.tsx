import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function Button({ 
  title, 
  onPress, 
  isLoading, 
  disabled,
  variant = 'primary',
  style
}: ButtonProps) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;

const styles = StyleSheet.create({
  button: {
    backgroundColor: currentTheme.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: currentTheme.primary,
  },
  text: {
    ...typography(currentTheme).body,
    color: currentTheme.white,
    fontWeight: '600',
  },
  secondaryText: {
    color: currentTheme.primary,
  },
  disabled: {
    opacity: 0.5,
  },
}); 

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[
          styles.text,
          variant === 'secondary' && styles.secondaryText,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
