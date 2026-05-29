import React from 'react';
import {
    ActivityIndicator,
    GestureResponderEvent,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radii, Spacing, Typography } from '@/src/constants/theme';

type ButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const backgroundColor =
    variant === 'primary' ? '#DCA1A1' : variant === 'secondary' ? theme.card : 'transparent';
  const textColor =
    variant === 'primary' ? theme.background : variant === 'secondary' ? '#DCA1A1' : '#DCA1A1';
  const borderColor = variant === 'secondary' ? '#DCA1A1' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        { backgroundColor, borderColor, opacity: pressed || disabled ? 0.75 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: Typography.body,
    fontWeight: '600',
  },
});
