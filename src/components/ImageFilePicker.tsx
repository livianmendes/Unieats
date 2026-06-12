import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ImageFilePickerProps = {
  label: string;
  disabled?: boolean;
  onImageSelected: (imageDataUrl: string) => void;
};

export function ImageFilePicker({ label, disabled = false, onImageSelected }: ImageFilePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (Platform.OS !== 'web') {
    return null;
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
      }

      if (event.target) {
        event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <View style={styles.root}>
      {React.createElement('input', {
        ref: inputRef,
        type: 'file',
        accept: 'image/png,image/jpeg,image/webp',
        style: { display: 'none' },
        onChange: handleChange,
      })}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonMuted]}
        onPress={() => inputRef.current?.click()}>
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  button: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#050505',
    backgroundColor: '#FFFFFF',
  },
  buttonMuted: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
});
