export type Migration = {
  version: number;
  statements: string[];
};

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      'PRAGMA journal_mode = WAL;',
      `CREATE TABLE IF NOT EXISTS local_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER,
        drill_type TEXT NOT NULL DEFAULT 'solo_session',
        total_attempts INTEGER NOT NULL DEFAULT 0,
        total_makes INTEGER NOT NULL DEFAULT 0,
        fg_pct REAL NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'completed',
        sync_state TEXT NOT NULL DEFAULT 'pending'
      );`,
      `CREATE TABLE IF NOT EXISTS local_shot_events (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        timestamp_ms INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        confidence REAL,
        clip_path_local TEXT,
        clip_path_remote TEXT,
        sync_state TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (session_id) REFERENCES local_sessions(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS local_session_calibrations (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        hoop_roi TEXT NOT NULL,
        shooter_seed TEXT,
        device_info TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES local_sessions(id) ON DELETE CASCADE
      );`,
      'CREATE INDEX IF NOT EXISTS idx_local_sessions_started_at ON local_sessions(started_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_local_shot_events_session_id ON local_shot_events(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_local_sessions_sync_state ON local_sessions(sync_state);',
      'CREATE INDEX IF NOT EXISTS idx_local_shot_events_sync_state ON local_shot_events(sync_state);',
    ],
  },
];
