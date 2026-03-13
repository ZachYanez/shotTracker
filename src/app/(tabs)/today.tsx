import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PercentageTrendChart } from '@/components/charts/PercentageTrendChart';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { SessionStatRow } from '@/components/sessions/SessionStatRow';
import { buildHistorySnapshot } from '@/features/history/historySelectors';
import { palette, spacing, typography } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';

export default function TodayScreen() {
  const router = useRouter();
  const sessions = useHistoryStore((state) => state.sessions);
  const snapshot = buildHistorySnapshot(sessions);
  const lastSession = snapshot.recentSessions[0];

  return (
    <ScreenShell title="Today" subtitle="Your shooting at a glance.">
      <SectionCard title="Ready to shoot?">
        <Text style={styles.copy}>
          Set up your phone with a view of the hoop, calibrate once, and start tracking.
        </Text>
        <PrimaryButton onPress={() => router.push('/session/new')}>Start Session</PrimaryButton>
      </SectionCard>

      <SectionCard eyebrow="Your Numbers" title="Overview">
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{snapshot.lifetimeFgPct.toFixed(0)}%</Text>
            <Text style={styles.metricLabel}>FG%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{snapshot.sessionCount}</Text>
            <Text style={styles.metricLabel}>Sessions</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{snapshot.totalAttempts}</Text>
            <Text style={styles.metricLabel}>Shots</Text>
          </View>
        </View>
        <PercentageTrendChart points={snapshot.trend} />
      </SectionCard>

      {lastSession ? (
        <SectionCard eyebrow="Last Session" title={`${lastSession.fgPct.toFixed(0)}% shooting`}>
          <SessionStatRow
            label="Result"
            value={`${lastSession.totalMakes}/${lastSession.totalAttempts}`}
          />
          <SessionStatRow label="Duration" value={`${Math.round(lastSession.durationSeconds / 60)} min`} />
          <SessionStatRow
            label="Date"
            value={new Date(lastSession.startedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          />
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metric: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 14,
    flex: 1,
    gap: spacing.xxs,
    padding: spacing.md,
  },
  metricValue: {
    color: palette.text,
    ...typography.stat,
  },
  metricLabel: {
    color: palette.textSubtle,
    ...typography.overline,
  },
});
