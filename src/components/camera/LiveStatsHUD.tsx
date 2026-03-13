import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing } from '@/lib/theme';
import type { LiveSessionStats } from '@/types/session';

type LiveStatsHUDProps = {
  stats: LiveSessionStats;
};

export function LiveStatsHUD({ stats }: LiveStatsHUDProps) {
  const items = [
    { label: 'Attempts', value: stats.attempts.toString() },
    { label: 'Makes', value: stats.makes.toString() },
    { label: 'FG%', value: `${stats.fgPct.toFixed(1)}%` },
    { label: 'Streak', value: stats.currentStreak.toString() },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.label} style={[styles.stat, item.label === 'FG%' ? styles.statFeatured : null]}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
      {stats.warnings.length > 0 ? (
        <Text style={styles.warning}>Warning: {stats.warnings.join(', ')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(5, 5, 5, 0.84)',
    borderColor: palette.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    flex: 1,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  statFeatured: {
    backgroundColor: palette.accentSoft,
  },
  value: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  label: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  warning: {
    backgroundColor: 'rgba(255, 189, 82, 0.12)',
    borderRadius: radius.pill,
    color: palette.warning,
    flexBasis: '100%',
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
