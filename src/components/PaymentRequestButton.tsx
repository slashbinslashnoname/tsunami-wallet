import React from 'react';
import { StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import { useThemeMode } from '../contexts/ThemeContext';
interface PaymentRequestButtonProps {
  onPress: () => void;
}

export function PaymentRequestButton({ onPress }: PaymentRequestButtonProps) {
  const { theme } = useThemeMode();
  const currentTheme = theme === 'dark' ? colors.dark : colors.light;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...shadows(currentTheme).large,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: currentTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows(currentTheme).medium,
  },
  buttonPressed: {
    backgroundColor: currentTheme.secondary,
  },
}); 

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <MaterialCommunityIcons 
          name="plus" 
          size={32} 
          color={currentTheme.white} 
        />
      </Pressable>
    </Animated.View>
  );
}
