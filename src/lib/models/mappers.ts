import type { LocalSessionRow, SessionRow, ShotEventRow } from '@/types/api';
import type { SessionSummary, ShotEvent } from '@/types/session';

const safePercent = (makes: number, attempts: number, fallback = 0) => {
  if (attempts <= 0) {
    return fallback;
  }

  return Number(((makes / attempts) * 100).toFixed(1));
};

export function mapRemoteSession(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds ?? 0,
    drillType: 'solo_session',
    totalAttempts: row.total_attempts,
    totalMakes: row.total_makes,
    fgPct: Number(row.fg_pct),
    currentStreak: 0,
    bestStreak: 0,
    status: row.status,
    syncState: 'synced',
  };
}

export function mapLocalSession(row: LocalSessionRow): SessionSummary {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds ?? 0,
    drillType: row.drill_type,
    totalAttempts: row.total_attempts,
    totalMakes: row.total_makes,
    fgPct: safePercent(row.total_makes, row.total_attempts, row.fg_pct),
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    status: row.status,
    syncState: row.sync_state,
  };
}

export function mapShotEvent(row: ShotEventRow): ShotEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestampMs: row.timestamp_ms,
    eventType: row.event_type,
    confidence: row.confidence ?? 0,
    clipPathRemote: row.clip_path,
  };
}
