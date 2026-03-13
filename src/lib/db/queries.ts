export const sessionQueries = {
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
};
