import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, typography } from '@/lib/theme';
import type { SessionSummary } from '@/types/session';

type SessionCardProps = {
  session: SessionSummary;
  onPress?: () => void;
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <Text style={styles.date}>
          {new Date(session.startedAt).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.time}>
          {new Date(session.startedAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.primaryStat}>
          <Text style={styles.pctValue}>{session.fgPct.toFixed(0)}</Text>
          <Text style={styles.pctSymbol}>%</Text>
        </View>
        <View style={styles.secondaryStats}>
          <Text style={styles.shotLine}>
            {session.totalMakes}/{session.totalAttempts}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{session.bestStreak} streak</Text>
            <View style={styles.dot} />
            <Text style={styles.meta}>{Math.round(session.durationSeconds / 60)}m</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.subtle,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    color: palette.text,
    ...typography.headline,
  },
  time: {
    color: palette.textMuted,
    ...typography.callout,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryStat: {
    alignItems: 'baseline',
    backgroundColor: palette.accentSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pctValue: {
    color: palette.accent,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  pctSymbol: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 1,
  },
  secondaryStats: {
    flex: 1,
    gap: spacing.xxs,
  },
  shotLine: {
    color: palette.text,
    ...typography.headline,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    backgroundColor: palette.textSubtle,
    borderRadius: 2,
    height: 3,
    width: 3,
  },
  meta: {
    color: palette.textMuted,
    ...typography.caption,
    textTransform: 'none',
  },
});
