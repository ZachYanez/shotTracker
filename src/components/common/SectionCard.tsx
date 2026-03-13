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
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.subtle,
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
