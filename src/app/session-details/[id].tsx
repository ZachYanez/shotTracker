import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { SessionStatRow } from '@/components/sessions/SessionStatRow';
import { palette, spacing, typography } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Array.isArray(id) ? id[0] : id;
  const session = useHistoryStore((state) => state.sessions.find((item) => item.id === sessionId));

  if (!session) {
    return (
      <ScreenShell title="Session" subtitle="This session couldn't be found.">
        <SectionCard title="Not available">
          <Text style={styles.copy}>This session may have been removed or hasn't synced yet.</Text>
        </SectionCard>
      </ScreenShell>
    );
  }

  const dateLabel = new Date(session.startedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScreenShell title={`${session.fgPct.toFixed(0)}% shooting`} subtitle={dateLabel}>
      <View style={styles.metricStrip}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{session.fgPct.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>FG%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{session.totalMakes}/{session.totalAttempts}</Text>
          <Text style={styles.metricLabel}>Shots</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{session.bestStreak}</Text>
          <Text style={styles.metricLabel}>Best streak</Text>
        </View>
      </View>

      <SectionCard title="Details">
        <SessionStatRow label="Duration" value={`${Math.round(session.durationSeconds / 60)} min`} />
        <SessionStatRow label="Best streak" value={session.bestStreak.toString()} />
        <SessionStatRow label="Status" value={session.status === 'completed' ? 'Completed' : session.status} />
        <SessionStatRow label="Saved" value={session.syncState === 'synced' ? 'Cloud' : 'Local'} />
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metricStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  metricValue: {
    color: palette.text,
    ...typography.stat,
  },
  metricLabel: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
});
