import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { palette, radius, shadow, spacing } from '@/lib/theme';

type PrimaryButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}>;

export function PrimaryButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text style={[styles.label, variant === 'secondary' ? styles.secondaryLabel : null]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: palette.accent,
    ...shadow.button,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: palette.borderStrong,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryLabel: {
    color: palette.text,
  },
});
