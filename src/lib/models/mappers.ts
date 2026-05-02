import type {
  LocalNativeFrameSampleRow,
  LocalSessionRow,
  LocalShotEventRow,
  SessionCalibrationRow,
  SessionRow,
  ShotEventRow,
} from '@/types/api';
import type {
  BoundingBox,
  NativeFrameTelemetrySample,
  NativeWarning,
  SessionSummary,
  ShotEvent,
  ShotEventType,
  StoredSessionCalibration,
} from '@/types/session';

const safePercent = (makes: number, attempts: number, fallback = 0) => {
  if (attempts <= 0) {
    return fallback;
  }

  return Number(((makes / attempts) * 100).toFixed(1));
};

function parseNullableJson<T>(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

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

export function mapLocalShotEvent(row: LocalShotEventRow): ShotEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestampMs: row.timestamp_ms,
    eventType: row.event_type,
    confidence: row.confidence ?? 0,
    clipPathLocal: row.clip_path_local,
    clipPathRemote: row.clip_path_remote,
  };
}

export function mapLocalNativeFrameSample(row: LocalNativeFrameSampleRow): NativeFrameTelemetrySample {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestampMs: row.timestamp_ms,
    trigger: row.trigger,
    eventTypes: parseNullableJson<ShotEventType[]>(row.event_types) ?? [],
    warnings: parseNullableJson<NativeWarning[]>(row.warnings) ?? [],
    shooter: {
      tracked: row.shooter_tracked === 1,
      box: parseNullableJson<BoundingBox>(row.shooter_box),
      confidence: row.shooter_confidence ?? 0,
    },
    ball: {
      detected: row.ball_detected === 1,
      box: parseNullableJson<BoundingBox>(row.ball_box),
      velocity: parseNullableJson<{ x: number; y: number }>(row.ball_velocity),
      confidence: row.ball_confidence ?? 0,
    },
    rim: {
      detected: row.rim_detected === 1,
      box: parseNullableJson<BoundingBox>(row.rim_box),
      confidence: row.rim_confidence ?? 0,
    },
  };
}

export function mapSessionCalibration(row: SessionCalibrationRow): StoredSessionCalibration {
  return {
    hoopROI: parseNullableJson<StoredSessionCalibration['hoopROI']>(row.hoop_roi) ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    shooterSeed: parseNullableJson<StoredSessionCalibration['shooterSeed']>(row.shooter_seed),
    deviceInfo: parseNullableJson<StoredSessionCalibration['deviceInfo']>(row.device_info),
    createdAt: row.created_at,
  };
}
