import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, typography } from '@/lib/theme';

type SectionCardProps = PropsWithChildren<{
  title?: string;
  eyebrow?: string;
}>;

export function SectionCard({ title, eyebrow, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {/* Frosted glass top-edge shimmer */}
      <View style={styles.topShimmer} />
      {/* Retro HUD accent bar — only on labelled cards */}
      {eyebrow ? <View style={styles.accentBar} /> : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.glass,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  // Single-pixel shimmer line at the top — simulates light refracting through glass
  topShimmer: {
    backgroundColor: palette.glassHighlight,
    height: 1,
    left: radius.lg,
    position: 'absolute',
    right: radius.lg,
    top: 0,
  },
  // 3px left accent bar — retro HUD "panel marker" for categorised sections
  accentBar: {
    backgroundColor: palette.accent,
    borderRadius: 3,
    bottom: spacing.lg,
    left: 0,
    position: 'absolute',
    top: spacing.lg,
    width: 3,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: palette.accent,
    ...typography.overline,
  },
  title: {
    color: palette.text,
    ...typography.title2,
  },
});
