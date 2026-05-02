import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/lib/theme';
import type { TrendPoint } from '@/types/history';

type PercentageTrendChartProps = {
  points: TrendPoint[];
};

// Horizontal grid lines in the chart background — retro graph paper feel
function ChartGrid() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[25, 50, 75].map((pct) => (
        <View
          key={pct}
          style={[
            styles.gridLine,
            { bottom: `${pct}%` as unknown as number },
          ]}
        />
      ))}
    </View>
  );
}

export function PercentageTrendChart({ points }: PercentageTrendChartProps) {
  const peak = Math.max(...points.map((p) => p.fgPct), 1);

  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Complete a session to see your trend</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChartGrid />
      {points.map((point) => {
        const isPeak = point.fgPct === peak;
        const fillPct = Math.max((point.fgPct / peak) * 100, 8);
        return (
          <View key={point.date} style={styles.column}>
            <Text style={[styles.value, isPeak ? styles.valuePeak : styles.valueDim]}>
              {point.fgPct.toFixed(0)}%
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  isPeak ? styles.barPeak : styles.barDefault,
                  { height: `${fillPct}%` as unknown as number },
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
    minHeight: 168,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xxs,
  },
  // Flat bottom of track so bars feel "grounded" on the grid
  barTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  bar: {
    // Angular tops — only bottom corners rounded, like retro pixel bars
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 6,
    width: '100%',
  },
  barDefault: {
    backgroundColor: palette.surfaceMuted,
  },
  barPeak: {
    backgroundColor: palette.accent,
    // Neon glow on the peak bar
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  value: {
    ...typography.caption,
  },
  valuePeak: {
    color: palette.accent,
  },
  valueDim: {
    color: palette.textSubtle,
  },
  label: {
    color: palette.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  // Faint horizontal grid lines inside the chart area
  gridLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
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
