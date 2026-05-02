import type { NativeWarning, SessionStatus, ShotEventType, SyncState } from './session';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  dominant_hand: 'left' | 'right' | 'either' | null;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_attempts: number;
  total_makes: number;
  fg_pct: number;
  source: string;
  status: SessionStatus;
  model_version: string | null;
  created_at: string;
  updated_at: string;
};

export type ShotEventRow = {
  id: string;
  session_id: string;
  user_id: string;
  timestamp_ms: number;
  event_type: ShotEventType;
  confidence: number | null;
  clip_path: string | null;
  created_at: string;
};

export type SessionCalibrationRow = {
  id: string;
  session_id: string;
  hoop_roi: string;
  shooter_seed: string | null;
  device_info: string | null;
  created_at: string;
};

export type LocalSessionRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  drill_type: string;
  total_attempts: number;
  total_makes: number;
  fg_pct: number;
  current_streak: number;
  best_streak: number;
  status: SessionStatus;
  sync_state: SyncState;
};

export type LocalShotEventRow = {
  id: string;
  session_id: string;
  timestamp_ms: number;
  event_type: ShotEventType;
  confidence: number | null;
  clip_path_local: string | null;
  clip_path_remote: string | null;
  sync_state: SyncState;
};

export type LocalNativeFrameSampleRow = {
  id: string;
  session_id: string;
  timestamp_ms: number;
  trigger: 'event' | 'warning';
  event_types: string;
  warnings: string;
  shooter_box: string | null;
  shooter_confidence: number | null;
  shooter_tracked: 0 | 1;
  ball_box: string | null;
  ball_velocity: string | null;
  ball_confidence: number | null;
  ball_detected: 0 | 1;
  rim_box: string | null;
  rim_confidence: number | null;
  rim_detected: 0 | 1;
  created_at: string;
};
