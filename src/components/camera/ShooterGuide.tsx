import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/lib/theme';

type ShooterGuideProps = {
  steps: string[];
};

export function ShooterGuide({ steps }: ShooterGuideProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step} style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{index + 1}</Text>
          </View>
          <Text style={styles.step}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  badgeLabel: {
    color: palette.accent,
    fontWeight: '700',
  },
  step: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
