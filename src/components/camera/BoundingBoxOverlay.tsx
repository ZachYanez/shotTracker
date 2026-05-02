import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/lib/theme';
import type { BoundingBox } from '@/types/session';

type BoundingBoxOverlayProps = {
  box: BoundingBox;
  label: string;
  tone?: 'accent' | 'success' | 'warning' | 'neutral';
  dashed?: boolean;
};

const toneStyles = {
  accent: {
    borderColor: palette.accent,
    chipBackground: palette.accent,
    chipText: '#ffffff',
  },
  success: {
    borderColor: palette.success,
    chipBackground: palette.success,
    chipText: '#04130a',
  },
  warning: {
    borderColor: palette.warning,
    chipBackground: palette.warning,
    chipText: '#2d1b00',
  },
  neutral: {
    borderColor: 'rgba(255,255,255,0.28)',
    chipBackground: 'rgba(255,255,255,0.16)',
    chipText: palette.text,
  },
} as const;

export function BoundingBoxOverlay({
  box,
  label,
  tone = 'neutral',
  dashed = false,
}: BoundingBoxOverlayProps) {
  const colors = toneStyles[tone];

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        dashed ? styles.dashed : null,
        {
          borderColor: colors.borderColor,
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.width * 100}%`,
          height: `${box.height * 100}%`,
        },
      ]}>
      <Text
        style={[
          styles.label,
          {
            backgroundColor: colors.chipBackground,
            color: colors.chipText,
          },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    borderRadius: radius.md,
    borderWidth: 2,
    position: 'absolute',
  },
  dashed: {
    borderStyle: 'dashed',
  },
  label: {
    borderRadius: radius.pill,
    fontSize: 11,
    fontWeight: '800',
    left: 8,
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    position: 'absolute',
    textTransform: 'uppercase',
    top: -13,
  },
});
