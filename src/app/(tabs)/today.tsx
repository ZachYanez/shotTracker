import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PercentageTrendChart } from '@/components/charts/PercentageTrendChart';
import { AppBackground } from '@/components/common/AppBackground';
import { SessionRow } from '@/components/sessions/SessionRow';
import { buildHistorySnapshot, buildSevenDaySnapshot } from '@/features/history/historySelectors';
import { palette, radius, spacing } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';
import { useHistoryStore } from '@/stores/historyStore';

export default function TodayScreen() {
  const router = useRouter();
  const sessions = useHistoryStore((state) => state.sessions);
  const auth = useAuthStore();
  const snapshot = buildHistorySnapshot(sessions);

  const sevenDaySessions = buildSevenDaySnapshot(sessions);
  const sevenDayAttempts = sevenDaySessions.reduce((s, x) => s + x.totalAttempts, 0);
  const sevenDayMakes = sevenDaySessions.reduce((s, x) => s + x.totalMakes, 0);
  const sevenDayFg = sevenDayAttempts > 0 ? Math.round((sevenDayMakes / sevenDayAttempts) * 100) : 0;

  const prevWeekSessions = sessions.filter((s) => {
    const age = (Date.now() - new Date(s.startedAt).getTime()) / (24 * 60 * 60 * 1000);
    return age >= 7 && age < 14;
  });
  const prevAttempts = prevWeekSessions.reduce((s, x) => s + x.totalAttempts, 0);
  const prevMakes = prevWeekSessions.reduce((s, x) => s + x.totalMakes, 0);
  const prevFg = prevAttempts > 0 ? Math.round((prevMakes / prevAttempts) * 100) : 0;
  const delta = sevenDayFg - prevFg;

  const currentStreak = snapshot.recentSessions[0]?.currentStreak ?? 0;
  const firstName = auth.displayName?.split(' ')[0] ?? 'Shooter';
  const rawInitials = auth.displayName
    ? auth.displayName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';
  const initials = rawInitials.slice(0, 2);
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{dateLabel}</Text>
              <Text style={styles.title}>Morning, {firstName}.</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          {/* Hero stat card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardTop}>
              <Text style={styles.heroEyebrow}>Career · FG%</Text>
              {sevenDaySessions.length > 0 && prevAttempts > 0 ? (
                <View style={[styles.pill, styles.pillGreen]}>
                  <Text style={styles.pillTextGreen}>
                    {delta >= 0 ? '+' : ''}{delta}% · 7d
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.heroStatRow}>
              <Text style={styles.heroNumber}>{snapshot.lifetimeFgPct.toFixed(0)}</Text>
              <Text style={styles.heroPctSymbol}>%</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <HeroStat label="Makes" value={snapshot.totalMakes} />
              <View style={styles.heroDivider} />
              <HeroStat label="Attempts" value={snapshot.totalAttempts} />
              <View style={styles.heroDivider} />
              <HeroStat label="Streak" value={currentStreak} accent />
            </View>
          </View>

          {/* Start session CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/session/new')}
            style={styles.startBtn}>
            <View style={styles.startDot} />
            <Text style={styles.startBtnText}>Start Session</Text>
          </TouchableOpacity>

          {/* Trend */}
          {snapshot.trend.length > 0 ? (
            <View>
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>Last {snapshot.trend.length} sessions</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.trendHeader}>
                  <View>
                    <Text style={styles.trendEyebrow}>7-day average</Text>
                    <Text style={styles.trendValue}>
                      {sevenDayFg > 0 ? sevenDayFg : snapshot.lifetimeFgPct.toFixed(0)}
                      <Text style={styles.trendValueSuffix}>%</Text>
                    </Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{snapshot.trend.length} sessions</Text>
                  </View>
                </View>
                <PercentageTrendChart compact points={snapshot.trend} />
              </View>
            </View>
          ) : null}

          {/* Recent sessions */}
          {snapshot.recentSessions.length > 0 ? (
            <View>
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>Recent</Text>
              </View>
              {snapshot.recentSessions.slice(0, 3).map((session) => (
                <SessionRow
                  key={session.id}
                  onPress={() =>
                    router.push(`/session-details/${session.id}` as Parameters<typeof router.push>[0])
                  }
                  session={session}
                />
              ))}
            </View>
          ) : null}

          {/* Empty state */}
          {snapshot.sessionCount === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptySub}>
                Set up your phone facing the hoop, calibrate once, and start tracking.
              </Text>
            </View>
          ) : null}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={styles.heroStatBlock}>
      <Text style={[styles.heroStatValue, accent ? styles.heroStatValueAccent : null]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  content: {
    gap: 22,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eyebrow: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: 6,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: 'rgba(16, 16, 30, 0.86)',
    borderColor: 'rgba(255, 56, 92, 0.22)',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 20,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  heroCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroEyebrow: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heroStatRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  heroNumber: {
    color: palette.text,
    fontSize: 96,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 96,
  },
  heroPctSymbol: {
    color: palette.accent,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    paddingBottom: 6,
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
  },
  heroDivider: {
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    width: 1,
  },
  heroStatBlock: {
    gap: 4,
  },
  heroStatValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroStatValueAccent: {
    color: palette.accent,
  },
  heroStatLabel: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  startBtn: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    elevation: 10,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
  },
  startDot: {
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    width: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillGreen: {
    backgroundColor: 'rgba(0, 208, 132, 0.14)',
    borderColor: 'rgba(0, 208, 132, 0.3)',
  },
  pillText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  pillTextGreen: {
    color: palette.success,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    marginBottom: 2,
    marginHorizontal: 4,
  },
  sectionLabelText: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(16, 16, 30, 0.86)',
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  trendHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendEyebrow: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  trendValue: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
  },
  trendValueSuffix: {
    color: palette.textSubtle,
    fontSize: 18,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 16, 30, 0.86)',
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 28,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptySub: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
