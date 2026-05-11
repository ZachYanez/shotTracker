import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius } from '@/lib/theme';
import type { SessionSummary } from '@/types/session';

type SessionRowProps = {
  session: SessionSummary;
  onPress?: () => void;
};

function getRelativeDay(date: Date): string {
  const diffDays = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function SessionRow({ session, onPress }: SessionRowProps) {
  const date = new Date(session.startedAt);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dur = `${Math.round(session.durationSeconds / 60)}m`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.pctBlock}>
        <Text style={styles.pctValue}>{session.fgPct.toFixed(0)}</Text>
        <Text style={styles.pctLabel}>FG%</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaTitle} numberOfLines={1}>{session.drillType || 'Session'}</Text>
        <Text style={styles.metaSub}>{session.totalMakes}/{session.totalAttempts} · {dur}</Text>
      </View>
      <View style={styles.dateBlock}>
        <Text style={styles.dateText}>{getRelativeDay(date)}</Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  pctBlock: {
    width: 52,
  },
  pctValue: {
    color: palette.accent,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  pctLabel: {
    color: palette.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  metaTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  metaSub: {
    color: palette.textSubtle,
    fontSize: 12,
  },
  dateBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dateText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: palette.textSubtle,
    fontSize: 11,
  },
});
