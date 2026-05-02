import { StyleSheet, Text, View } from 'react-native';

import { formatCalibrationStatusLabel } from '@/features/session/calibrationReadiness';
import { palette, radius, spacing, typography } from '@/lib/theme';
import type { CalibrationReadiness } from '@/types/session';

type CalibrationReadinessCardProps = {
  readiness: CalibrationReadiness;
  eyebrow?: string;
  title?: string;
};

function formatSeconds(valueMs: number) {
  return `${(valueMs / 1000).toFixed(1)}s`;
}

export function CalibrationReadinessCard({
  readiness,
  eyebrow = 'Readiness',
  title = 'Calibration lock',
}: CalibrationReadinessCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.statusChip, readiness.readyToStart ? styles.statusChipReady : null]}>
          <Text style={[styles.statusLabel, readiness.readyToStart ? styles.statusLabelReady : null]}>
            {formatCalibrationStatusLabel(readiness)}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreMetric}>
          <Text style={styles.scoreValue}>{Math.round(readiness.readinessScore * 100)}%</Text>
          <Text style={styles.scoreLabel}>Readiness</Text>
        </View>
        <View style={styles.scoreMetric}>
          <Text style={styles.scoreValue}>{formatSeconds(readiness.rimStableMs)}</Text>
          <Text style={styles.scoreLabel}>Hoop hold</Text>
        </View>
        <View style={styles.scoreMetric}>
          <Text style={styles.scoreValue}>{formatSeconds(readiness.shooterStableMs)}</Text>
          <Text style={styles.scoreLabel}>Shooter hold</Text>
        </View>
      </View>

      <Text style={styles.recommendation}>{readiness.recommendation}</Text>

      <View style={styles.stepStack}>
        {readiness.steps.map((step) => (
          <View key={step.id} style={styles.stepRow}>
            <View
              style={[
                styles.stepBadge,
                step.status === 'complete'
                  ? styles.stepBadgeComplete
                  : step.status === 'active'
                    ? styles.stepBadgeActive
                    : null,
              ]}>
              <Text
                style={[
                  styles.stepBadgeLabel,
                  step.status === 'complete'
                    ? styles.stepBadgeLabelComplete
                    : step.status === 'active'
                      ? styles.stepBadgeLabelActive
                      : null,
                ]}>
                {step.status === 'complete' ? 'OK' : step.status === 'active' ? '...' : '•'}
              </Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.label}</Text>
              <Text style={styles.stepDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      {readiness.warnings.length > 0 ? (
        <Text style={styles.warning}>Warning: {readiness.warnings.join(', ')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surfaceSoft,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: palette.accent,
    ...typography.overline,
  },
  title: {
    color: palette.text,
    ...typography.title2,
  },
  statusChip: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusChipReady: {
    backgroundColor: 'rgba(43, 200, 128, 0.12)',
  },
  statusLabel: {
    color: palette.textSecondary,
    ...typography.caption,
  },
  statusLabelReady: {
    color: palette.success,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scoreMetric: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    flex: 1,
    padding: spacing.md,
  },
  scoreValue: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  scoreLabel: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
  recommendation: {
    color: palette.textMuted,
    ...typography.body,
  },
  stepStack: {
    gap: spacing.sm,
  },
  stepRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepBadgeActive: {
    backgroundColor: 'rgba(77, 182, 255, 0.14)',
  },
  stepBadgeComplete: {
    backgroundColor: 'rgba(43, 200, 128, 0.14)',
  },
  stepBadgeLabel: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '800',
  },
  stepBadgeLabelActive: {
    color: palette.accent,
  },
  stepBadgeLabelComplete: {
    color: palette.success,
  },
  stepCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  stepTitle: {
    color: palette.text,
    ...typography.headline,
  },
  stepDetail: {
    color: palette.textMuted,
    ...typography.callout,
  },
  warning: {
    backgroundColor: 'rgba(255, 189, 82, 0.12)',
    borderRadius: radius.md,
    color: palette.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.callout,
  },
});
