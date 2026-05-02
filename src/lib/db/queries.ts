export const sessionQueries = {
  localSessionCount: `
    SELECT COUNT(*) AS count
    FROM local_sessions;
  `,
  localSessionById: `
    SELECT *
    FROM local_sessions
    WHERE id = ?
    LIMIT 1;
  `,
  recentLocalSessions: `
    SELECT *
    FROM local_sessions
    ORDER BY started_at DESC
    LIMIT ?;
  `,
  pendingLocalSessions: `
    SELECT *
    FROM local_sessions
    WHERE sync_state != 'synced'
    ORDER BY started_at ASC;
  `,
  upsertLocalSession: `
    INSERT OR REPLACE INTO local_sessions (
      id,
      started_at,
      ended_at,
      duration_seconds,
      drill_type,
      total_attempts,
      total_makes,
      fg_pct,
      current_streak,
      best_streak,
      status,
      sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
};

export const shotEventQueries = {
  localShotEventsBySessionId: `
    SELECT *
    FROM local_shot_events
    WHERE session_id = ?
    ORDER BY timestamp_ms ASC;
  `,
  insertLocalShotEvent: `
    INSERT OR REPLACE INTO local_shot_events (
      id,
      session_id,
      timestamp_ms,
      event_type,
      confidence,
      clip_path_local,
      clip_path_remote,
      sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `,
  pendingLocalShotEvents: `
    SELECT *
    FROM local_shot_events
    WHERE sync_state != 'synced'
    ORDER BY timestamp_ms ASC;
  `,
  pendingLocalShotEventCount: `
    SELECT COUNT(*) AS count
    FROM local_shot_events
    WHERE sync_state != 'synced';
  `,
};

export const nativeFrameSampleQueries = {
  localNativeFrameSamplesBySessionId: `
    SELECT *
    FROM local_native_frame_samples
    WHERE session_id = ?
    ORDER BY timestamp_ms ASC;
  `,
  insertLocalNativeFrameSample: `
    INSERT OR REPLACE INTO local_native_frame_samples (
      id,
      session_id,
      timestamp_ms,
      trigger,
      event_types,
      warnings,
      shooter_box,
      shooter_confidence,
      shooter_tracked,
      ball_box,
      ball_velocity,
      ball_confidence,
      ball_detected,
      rim_box,
      rim_confidence,
      rim_detected
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
};

export const calibrationQueries = {
  localCalibrationBySessionId: `
    SELECT *
    FROM local_session_calibrations
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 1;
  `,
  upsertLocalSessionCalibration: `
    INSERT OR REPLACE INTO local_session_calibrations (
      id,
      session_id,
      hoop_roi,
      shooter_seed,
      device_info
    ) VALUES (?, ?, ?, ?, ?);
  `,
};

export const syncQueries = {
  pendingLocalSessionCount: `
    SELECT COUNT(*) AS count
    FROM local_sessions
    WHERE sync_state != 'synced';
  `,
};
