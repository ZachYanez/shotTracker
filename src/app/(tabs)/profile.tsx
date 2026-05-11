import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { SessionStatRow } from '@/components/sessions/SessionStatRow';
import { describeSyncState } from '@/features/sync/syncQueue';
import { getBasketballProcessorStatus } from '@/lib/camera/frameProcessor';
import { palette, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSyncStore } from '@/stores/syncStore';

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const sync = useSyncStore();
  const clearAllSessions = useHistoryStore((state) => state.clearAllSessions);
  const processorStatus = getBasketballProcessorStatus();
  const hasSupabaseEnv = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
  const handleSyncNow = async () => {
    try {
      const result = await sync.syncNow();

      Alert.alert(
        'Sync complete',
        `${result.syncedSessions} sessions and ${result.syncedEvents} events synced.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed.';

      Alert.alert('Sync failed', message);
    }
  };

  const handleResetLifetimeFg = () => {
    Alert.alert(
      'Reset lifetime FG%?',
      'This removes every completed session stored on this device. Career field goal percentage and local history go back to zero until you log new sessions. Sessions already saved in the cloud are not removed from the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await clearAllSessions();
                await sync.refreshCounts();
                Alert.alert('Done', 'Lifetime FG% on this device has been reset.');
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Reset failed.';
                Alert.alert('Could not reset', message);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScreenShell eyebrow="Account" title="Profile">
      <SectionCard title={auth.displayName ?? 'Anonymous'}>
        <Text style={styles.copy}>
          {auth.status === 'signed_in'
            ? auth.email ?? 'Signed in'
            : 'Sign in to sync your sessions across devices.'}
        </Text>
        <View style={styles.pillRow}>
          <View style={[styles.pill, auth.status === 'signed_in' && styles.pillActive]}>
            <Text style={[styles.pillLabel, auth.status === 'signed_in' && styles.pillLabelActive]}>
              {auth.status === 'signed_in' ? 'Signed in' : 'Demo mode'}
            </Text>
          </View>
        </View>
        <PrimaryButton onPress={() => router.push('/sign-in')} variant="secondary">
          {auth.status === 'signed_in' ? 'Account Settings' : 'Sign In'}
        </PrimaryButton>
      </SectionCard>

      <SectionCard eyebrow="Statistics" title="Lifetime FG%">
        <Text style={styles.copy}>
          Career field goal percentage is calculated from completed sessions on this device. Use reset if you want to start that aggregate over.
        </Text>
        <PrimaryButton variant="secondary" onPress={handleResetLifetimeFg}>
          Reset lifetime FG%
        </PrimaryButton>
      </SectionCard>

      <SectionCard eyebrow="Sync" title="Data status">
        <Text style={styles.copy}>{describeSyncState(sync)}</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Text style={styles.statusValue}>{sync.pendingSessions}</Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusValue}>{sync.pendingEvents}</Text>
            <Text style={styles.statusLabel}>Events</Text>
          </View>
        </View>
        <PrimaryButton disabled={!hasSupabaseEnv || sync.isSyncing} onPress={() => void handleSyncNow()}>
          {sync.isSyncing ? 'Syncing' : 'Sync Now'}
        </PrimaryButton>
      </SectionCard>

      <SectionCard eyebrow="System" title="App info">
        <SessionStatRow label="Cloud sync" value={hasSupabaseEnv ? 'Ready' : 'Not configured'} />
        <SessionStatRow label="Shot detection" value={processorStatus.shortLabel} />
        <SessionStatRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        <Text style={styles.copy}>{processorStatus.description}</Text>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pillActive: {
    backgroundColor: palette.successSoft,
  },
  pillLabel: {
    color: palette.textMuted,
    ...typography.caption,
  },
  pillLabelActive: {
    color: palette.success,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusCard: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 14,
    flex: 1,
    padding: spacing.md,
  },
  statusValue: {
    color: palette.text,
    ...typography.stat,
  },
  statusLabel: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
});
