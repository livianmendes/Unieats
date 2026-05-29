import React, { forwardRef } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Radii, Spacing, Typography } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type InputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  icon?: IconSymbolName;
  rightIcon?: IconSymbolName;
  onRightIconPress?: () => void;
  style?: StyleProp<ViewStyle>;
} & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'onBlur' | 'onSubmitEditing' | 'returnKeyType' | 'blurOnSubmit'>;

export const Input = forwardRef<TextInput, InputProps>(function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  keyboardType = 'default',
  autoCapitalize = 'none',
  onBlur,
  onSubmitEditing,
  returnKeyType,
  blurOnSubmit,
  style,
}: InputProps, ref) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.root, style]}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.card,
            borderColor: error ? theme.error : theme.border,
          },
        ]}>
        {icon ? <IconSymbol name={icon} color={theme.placeholder} size={20} style={styles.leadingIcon} /> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          style={[styles.input, { color: theme.text }]}
        />
        {rightIcon ? (
          <IconSymbol
            name={rightIcon}
            size={20}
            color={theme.tint}
            onPress={onRightIconPress}
            style={styles.trailingIcon}
          />
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.label,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.small,
    paddingHorizontal: Spacing.sm,
  },
  leadingIcon: {
    marginRight: Spacing.xs,
  },
  trailingIcon: {
    marginLeft: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body,
  },
  errorText: {
    color: '#EF4444',
    fontSize: Typography.label,
  },
});
