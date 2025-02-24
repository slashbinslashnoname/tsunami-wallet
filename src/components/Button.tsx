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
import { Theme } from '../theme/types';

// Add this type definition at the top of the file
type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
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

  const getButtonStyles = (variant: ButtonVariant, theme: Theme, disabled: boolean) => {
    const baseStyles = {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      minWidth: 120,
    };

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: variant === 'primary' ? theme.primary + '80' : 'transparent',
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: variant === 'secondary' ? theme.border + '80' : 'transparent',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: theme.primary,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border,
        };
      default:
        return baseStyles;
    }
  };

  const getTextStyles = (variant: ButtonVariant, theme: Theme, disabled: boolean) => {
    const baseStyles = {
      ...typography(theme).button,
      fontWeight: '600' as const,
    };

    if (disabled) {
      return {
        ...baseStyles,
        color: variant === 'primary' ? theme.white : theme.text.secondary + '80',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          color: theme.white,
        };
      case 'secondary':
        return {
          ...baseStyles,
          color: theme.text.primary,
        };
      default:
        return baseStyles;
    }
  };

  const styles = StyleSheet.create({
    button: getButtonStyles(variant, currentTheme, !!disabled),
    text: getTextStyles(variant, currentTheme, !!disabled),
    disabled: {
      opacity: 0.5,
    },
  }); 

  return (
    <TouchableOpacity
      style={[
        styles.button,
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
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
