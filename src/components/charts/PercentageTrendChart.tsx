import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/lib/theme';
import type { TrendPoint } from '@/types/history';

type PercentageTrendChartProps = {
  points: TrendPoint[];
};

export function PercentageTrendChart({ points }: PercentageTrendChartProps) {
  const peak = Math.max(...points.map((point) => point.fgPct), 1);

  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Complete a session to see your trend</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {points.map((point) => {
        const isPeak = point.fgPct === peak;
        return (
          <View key={point.date} style={styles.column}>
            <Text style={[styles.value, isPeak && styles.valuePeak]}>
              {point.fgPct.toFixed(0)}%
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  isPeak ? styles.barPeak : null,
                  { height: `${Math.max((point.fgPct / peak) * 100, 8)}%` },
                ]}
              />
            </View>
            <Text style={styles.label}>{point.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 160,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xxs,
  },
  barTrack: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  bar: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.sm,
    minHeight: 6,
    width: '100%',
  },
  barPeak: {
    backgroundColor: palette.accent,
  },
  value: {
    color: palette.textSubtle,
    ...typography.caption,
  },
  valuePeak: {
    color: palette.accent,
  },
  label: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: palette.textSubtle,
    ...typography.body,
  },
});
