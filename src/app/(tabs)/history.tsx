import { StyleSheet, Text, View } from 'react-native';

import { PercentageTrendChart } from '@/components/charts/PercentageTrendChart';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { SessionCard } from '@/components/sessions/SessionCard';
import { buildHistorySnapshot } from '@/features/history/historySelectors';
import { palette, spacing, typography } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';

export default function HistoryScreen() {
  const sessions = useHistoryStore((state) => state.sessions);
  const snapshot = buildHistorySnapshot(sessions);

  return (
    <ScreenShell title="History" subtitle="Your career numbers.">
      <SectionCard eyebrow="All Time" title="Career stats">
        <View style={styles.metricGrid}>
          <View style={styles.metric}>
            <Text style={styles.value}>{snapshot.lifetimeFgPct.toFixed(0)}%</Text>
            <Text style={styles.label}>FG%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.value}>{snapshot.totalMakes}</Text>
            <Text style={styles.label}>Makes</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.value}>{snapshot.totalAttempts}</Text>
            <Text style={styles.label}>Shots</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.value}>{snapshot.sessionCount}</Text>
            <Text style={styles.label}>Sessions</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Trend" title="Recent sessions">
        <PercentageTrendChart points={snapshot.trend} />
      </SectionCard>

      {snapshot.bestSession ? (
        <SectionCard eyebrow="Personal Best" title={`${snapshot.bestSession.fgPct.toFixed(0)}% shooting`}>
          <SessionCard session={snapshot.bestSession} />
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metric: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 14,
    flex: 1,
    minWidth: '46%',
    padding: spacing.md,
  },
  value: {
    color: palette.text,
    ...typography.stat,
  },
  label: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
});
