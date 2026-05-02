import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { formatCalibrationStatusLabel } from '@/features/session/calibrationReadiness';
import { SessionStatRow } from '@/components/sessions/SessionStatRow';
import { palette, spacing, typography } from '@/lib/theme';
import { useSessionStore } from '@/stores/sessionStore';

export default function SessionSummaryScreen() {
  const router = useRouter();
  const { savedCalibrationReadiness, summary } = useSessionStore((state) => ({
    savedCalibrationReadiness: state.savedCalibrationReadiness,
    summary: state.lastSummary,
  }));

  return (
    <ScreenShell title="Session Complete" subtitle="Nice work out there.">
      {summary ? (
        <>
          <View style={styles.heroSection}>
            <Text style={styles.heroPct}>{summary.fgPct.toFixed(0)}%</Text>
            <Text style={styles.heroShots}>
              {summary.totalMakes} of {summary.totalAttempts} shots made
            </Text>
          </View>

          <SectionCard title="Breakdown">
            <View style={styles.heroStats}>
              <View style={styles.heroCard}>
                <Text style={styles.heroValue}>{summary.fgPct.toFixed(1)}%</Text>
                <Text style={styles.heroLabel}>FG%</Text>
              </View>
              <View style={styles.heroCard}>
                <Text style={styles.heroValue}>{summary.bestStreak}</Text>
                <Text style={styles.heroLabel}>Best streak</Text>
              </View>
              <View style={styles.heroCard}>
                <Text style={styles.heroValue}>{Math.round(summary.durationSeconds / 60)}m</Text>
                <Text style={styles.heroLabel}>Duration</Text>
              </View>
            </View>
            <SessionStatRow label="Status" value={summary.syncState === 'synced' ? 'Saved' : 'Saved locally'} />
            <SessionStatRow label="Calibration" value={formatCalibrationStatusLabel(savedCalibrationReadiness)} />
          </SectionCard>

          {savedCalibrationReadiness ? (
            <SectionCard eyebrow="Setup" title="Calibration handoff">
              <Text style={styles.copy}>{savedCalibrationReadiness.recommendation}</Text>
            </SectionCard>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton onPress={() => router.push('/(tabs)/history')}>View History</PrimaryButton>
            <PrimaryButton onPress={() => router.push('/session/new')} variant="secondary">
              Shoot Again
            </PrimaryButton>
          </View>
        </>
      ) : (
        <SectionCard title="No session data">
          <Text style={styles.copy}>Start a session first to see your results here.</Text>
          <PrimaryButton onPress={() => router.push('/session/new')}>Start Session</PrimaryButton>
        </SectionCard>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  heroPct: {
    color: palette.accent,
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  heroShots: {
    color: palette.textSecondary,
    ...typography.headline,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  heroCard: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 14,
    flex: 1,
    padding: spacing.md,
  },
  heroValue: {
    color: palette.text,
    ...typography.stat,
  },
  heroLabel: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
  actions: {
    gap: spacing.sm,
  },
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
});
