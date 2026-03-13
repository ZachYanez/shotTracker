import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/common/ScreenShell';
import { SessionCard } from '@/components/sessions/SessionCard';
import { palette, spacing, typography } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';

export default function SessionsScreen() {
  const router = useRouter();
  const sessions = useHistoryStore((state) => state.sessions);

  return (
    <ScreenShell title="Sessions" subtitle="All your shooting sessions.">
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyBody}>
            Complete your first shooting session and it will show up here.
          </Text>
        </View>
      ) : (
        sessions.map((session) => (
          <SessionCard
            key={session.id}
            onPress={() =>
              router.push({
                pathname: '/session-details/[id]',
                params: { id: session.id },
              })
            }
            session={session}
          />
        ))
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: palette.textMuted,
    ...typography.title2,
  },
  emptyBody: {
    color: palette.textSubtle,
    ...typography.body,
    textAlign: 'center',
  },
});
