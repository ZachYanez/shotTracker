import type { HistorySnapshot, TrendPoint } from '@/types/history';
import type { SessionSummary } from '@/types/session';

const DAY = 24 * 60 * 60 * 1000;

function formatLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function buildTrendPoints(sessions: SessionSummary[]): TrendPoint[] {
  const ordered = [...sessions].sort(
    (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
  );

  return ordered.slice(-7).map((session) => ({
    date: session.startedAt,
    label: formatLabel(new Date(session.startedAt)),
    fgPct: session.fgPct,
    makes: session.totalMakes,
    attempts: session.totalAttempts,
  }));
}

export function buildHistorySnapshot(sessions: SessionSummary[]): HistorySnapshot {
  const completed = sessions.filter((session) => session.status === 'completed');
  const totalAttempts = completed.reduce((sum, session) => sum + session.totalAttempts, 0);
  const totalMakes = completed.reduce((sum, session) => sum + session.totalMakes, 0);
  const bestSession = [...completed].sort((left, right) => right.fgPct - left.fgPct)[0];

  return {
    lifetimeFgPct: totalAttempts > 0 ? Number(((totalMakes / totalAttempts) * 100).toFixed(1)) : 0,
    totalAttempts,
    totalMakes,
    sessionCount: completed.length,
    bestSession,
    trend: buildTrendPoints(completed),
    recentSessions: [...completed].sort(
      (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    ),
  };
}

export function buildSevenDaySnapshot(sessions: SessionSummary[]) {
  const cutoff = Date.now() - DAY * 7;
  return sessions.filter((session) => new Date(session.startedAt).getTime() >= cutoff);
}
